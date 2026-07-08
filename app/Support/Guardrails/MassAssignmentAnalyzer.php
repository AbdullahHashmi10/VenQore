<?php

namespace App\Support\Guardrails;

/**
 * MassAssignmentAnalyzer — Silent Data-Drift Guardrail
 * =====================================================
 *
 * WHY THIS EXISTS
 * ---------------
 * The most dangerous class of bug in this ERP is NOT "the feature crashed".
 * It is "the write succeeded, returned 200 OK, the row exists — but a field
 * silently went missing or wrong". A test that asserts assertStatus(200) or
 * assertDatabaseHas(['id' => $x]) passes right through that.
 *
 * The mechanical root cause is a mismatch between the array of keys a piece of
 * code passes to Eloquent (`Model::create([...])`, `updateOrCreate`, etc.) and
 * the columns that actually exist on that model's table. Two failure modes:
 *
 *   1. A key is passed that is NOT a real column. With `$guarded = []` Eloquent
 *      throws at runtime (only if that path is exercised by a test — often it
 *      isn't). With `$fillable` set, the key is SILENTLY dropped — no error,
 *      wrong data. This is the net_sales / invoice_total = 0 class of bug.
 *
 *   2. A column that code relies on is missing from `$fillable`, so it is
 *      silently dropped on create. (Detected by the companion fillable check.)
 *
 * This analyzer finds mode (1) statically — without needing the code path to
 * run — by parsing every static Eloquent write call in the codebase and
 * comparing the literal string keys against the real schema.
 *
 * DESIGN
 * ------
 *  - Framework-free: pure PHP tokenizer. No Laravel required to parse. The
 *    caller supplies a resolver (model class => allowed key set) so the schema
 *    lookup can use Laravel's Schema facade from inside a test/command, while
 *    this class stays independently unit-testable.
 *  - Conservative by construction: if a call's receiver class cannot be
 *    resolved to an App\Models\* class, or a key is a variable/spread/dynamic
 *    expression rather than a literal string, it is SKIPPED, never flagged.
 *    False negatives are acceptable; false positives that turn the suite red
 *    for no reason are not.
 *
 * SCOPE (intentional)
 * -------------------
 * Matches STATIC model write calls only:
 *     ModelClass::create([...])
 *     ModelClass::forceCreate([...])
 *     ModelClass::make([...])
 *     ModelClass::firstOrNew([...], [...])
 *     ModelClass::firstOrCreate([...], [...])
 *     ModelClass::updateOrCreate([...], [...])
 * These are unambiguous (the receiver names the model) and cover the large
 * majority of write paths. Instance calls like `$model->update([...])` are out
 * of scope precisely because the receiver's model type is not knowable from a
 * static token scan without full type inference — flagging them would produce
 * noise. Those are covered instead by runtime value-assertion tests.
 */
class MassAssignmentAnalyzer
{
    /** Eloquent static methods whose FIRST array arg is mass-assigned. */
    private const CREATE_METHODS = ['create', 'forceCreate', 'make'];

    /**
     * Eloquent static methods whose SECOND array arg is mass-assigned (the
     * first is the "match" attributes, which are also assigned on insert, so
     * both arrays are scanned).
     */
    private const UPSERT_METHODS = ['updateOrCreate', 'firstOrCreate', 'firstOrNew'];

    /**
     * Keys that are always acceptable even if not returned by the resolver
     * (timestamps and soft-delete columns are managed by Eloquent / usually
     * present). The resolver is expected to include real columns; this is just
     * a safety net so common framework columns never cause a false positive.
     */
    private const ALWAYS_ALLOWED = ['created_at', 'updated_at', 'deleted_at'];

    /**
     * Scan a set of directories and return every resolved static write call.
     *
     * @param  string[]  $directories  Absolute paths to scan recursively.
     * @return array<int, array{file:string, line:int, model:string, keys:string[]}>
     */
    public function scanDirectories(array $directories): array
    {
        $calls = [];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                continue;
            }

            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if ($file->isFile() && strtolower($file->getExtension()) === 'php') {
                    $path = $file->getPathname();
                    foreach ($this->scanFile($path) as $call) {
                        $calls[] = $call;
                    }
                }
            }
        }

        return $calls;
    }

    /**
     * Scan a single PHP file for static model write calls.
     *
     * @return array<int, array{file:string, line:int, model:string, keys:string[]}>
     */
    public function scanFile(string $path): array
    {
        $source = @file_get_contents($path);
        if ($source === false || $source === '') {
            return [];
        }

        // token_get_all can emit warnings on malformed input; suppress and bail.
        $tokens = @token_get_all($source);
        if (!is_array($tokens) || empty($tokens)) {
            return [];
        }

        // Normalise: keep only meaningful tokens but remember original for keys.
        $n = count($tokens);
        $calls = [];

        for ($i = 0; $i < $n; $i++) {
            $tok = $tokens[$i];
            if (!is_array($tok)) {
                continue;
            }

            // Look for a class name token that could begin `Class::method(`.
            if (!in_array($tok[0], [T_STRING, T_NAME_QUALIFIED, T_NAME_FULLY_QUALIFIED], true)) {
                continue;
            }

            $className = $tok[1];
            $line = $tok[2];

            if ($this->isDbFacade($className)) {
                // Expect `::` next
                $j = $this->nextMeaningful($tokens, $i + 1);
                if ($j === null || !is_array($tokens[$j]) || $tokens[$j][0] !== T_DOUBLE_COLON) {
                    continue;
                }

                // Then `table`
                $k = $this->nextMeaningful($tokens, $j + 1);
                if ($k === null || !is_array($tokens[$k]) || $tokens[$k][0] !== T_STRING || $tokens[$k][1] !== 'table') {
                    continue;
                }

                // Expect `(` next
                $p = $this->nextMeaningful($tokens, $k + 1);
                if ($p === null || $tokens[$p] !== '(') {
                    continue;
                }

                // The first argument of table() must be a T_CONSTANT_ENCAPSED_STRING
                $argTokIdx = $this->nextMeaningful($tokens, $p + 1);
                if ($argTokIdx === null || !is_array($tokens[$argTokIdx]) || $tokens[$argTokIdx][0] !== T_CONSTANT_ENCAPSED_STRING) {
                    continue;
                }
                $tableName = $this->unquote($tokens[$argTokIdx][1]);
                if ($tableName === null || $tableName === '') {
                    continue;
                }

                // Next should be `)` to close table()
                $closeParenIdx = $this->nextMeaningful($tokens, $argTokIdx + 1);
                if ($closeParenIdx === null || $tokens[$closeParenIdx] !== ')') {
                    continue;
                }

                // Now scan forward for ->insert, ->update, ->insertGetId, ->updateOrInsert
                $writeMethodInfo = $this->findChainedWriteMethod($tokens, $closeParenIdx + 1);
                if ($writeMethodInfo === null) {
                    continue;
                }

                [$methodName, $methodOpenParenIdx] = $writeMethodInfo;

                $isInsertOrUpdate = in_array($methodName, ['insert', 'update', 'insertGetId'], true);
                $isUpdateOrInsert = $methodName === 'updateOrInsert';

                if ($isInsertOrUpdate) {
                    $keys = $this->extractKeysFromDbWriteArgs($tokens, $methodOpenParenIdx, 1);
                } elseif ($isUpdateOrInsert) {
                    $keys = $this->extractKeysFromDbWriteArgs($tokens, $methodOpenParenIdx, 2);
                } else {
                    continue;
                }

                if (!empty($keys)) {
                    $calls[] = [
                        'file'  => $path,
                        'line'  => $line,
                        'model' => $tableName, // Store table name in the 'model' field
                        'keys'  => array_values(array_unique($keys)),
                    ];
                }
                continue;
            }

            // Next meaningful token must be `::`
            $j = $this->nextMeaningful($tokens, $i + 1);
            if ($j === null || !is_array($tokens[$j]) || $tokens[$j][0] !== T_DOUBLE_COLON) {
                continue;
            }

            // Then the method name.
            $k = $this->nextMeaningful($tokens, $j + 1);
            if ($k === null || !is_array($tokens[$k]) || $tokens[$k][0] !== T_STRING) {
                continue;
            }
            $method = $tokens[$k][1];

            $isCreate = in_array($method, self::CREATE_METHODS, true);
            $isUpsert = in_array($method, self::UPSERT_METHODS, true);
            if (!$isCreate && !$isUpsert) {
                continue;
            }

            $model = $this->resolveModelClass($className);
            if ($model === null) {
                continue; // cannot resolve → do not flag
            }

            // Expect `(` next.
            $p = $this->nextMeaningful($tokens, $k + 1);
            if ($p === null || $tokens[$p] !== '(') {
                continue;
            }

            // Gather the argument arrays. For create-methods: first array only.
            // For upsert-methods: first and second arrays.
            $arraysWanted = $isUpsert ? 2 : 1;
            $keys = $this->extractKeysFromCallArgs($tokens, $p, $arraysWanted);

            if (!empty($keys)) {
                $calls[] = [
                    'file'  => $path,
                    'line'  => $line,
                    'model' => $model,
                    'keys'  => array_values(array_unique($keys)),
                ];
            }
        }

        return $calls;
    }

    /**
     * Given the resolver, return every violation (a key not allowed for its
     * model). The resolver returns the set of allowed keys for a model class,
     * or null if the model/table cannot be introspected (then it is skipped).
     *
     * @param  array<int, array{file:string, line:int, model:string, keys:string[]}>  $calls
     * @param  callable(string):(string[]|null)  $allowedKeysResolver
     * @return array<int, array{file:string, line:int, model:string, key:string}>
     */
    public function findViolations(array $calls, callable $allowedKeysResolver): array
    {
        $violations = [];
        $cache = [];

        foreach ($calls as $call) {
            $model = $call['model'];

            if (!array_key_exists($model, $cache)) {
                $cache[$model] = $allowedKeysResolver($model);
            }
            $allowed = $cache[$model];

            if ($allowed === null) {
                continue; // not introspectable → skip, never flag
            }

            $allowedSet = array_flip(array_merge($allowed, self::ALWAYS_ALLOWED));

            foreach ($call['keys'] as $key) {
                if (!isset($allowedSet[$key])) {
                    $violations[] = [
                        'file'  => $call['file'],
                        'line'  => $call['line'],
                        'model' => $model,
                        'key'   => $key,
                    ];
                }
            }
        }

        return $violations;
    }

    /**
     * Resolve a written class name (as it appears in source) to an
     * App\Models\* fully-qualified class, or null if it is not a known model.
     */
    private function resolveModelClass(string $written): ?string
    {
        $written = ltrim($written, '\\');

        // Basename after the last backslash (handles Models\Sale, App\Models\Sale, Sale).
        $base = $written;
        if (($pos = strrpos($written, '\\')) !== false) {
            $base = substr($written, $pos + 1);
        }

        // Only single-word capitalised identifiers are plausible model names.
        if ($base === '' || !ctype_upper($base[0])) {
            return null;
        }

        $candidate = 'App\\Models\\' . $base;

        return class_exists($candidate) ? $candidate : null;
    }

    /**
     * From the position of the opening `(` of a call, walk its argument list
     * and extract the top-level `'key' =>` literal keys from up to
     * $arraysWanted array literals (arguments that are `[ ... ]`).
     *
     * @return string[]
     */
    private function extractKeysFromCallArgs(array $tokens, int $openParenIndex, int $arraysWanted): array
    {
        $n = count($tokens);
        $depth = 0;          // paren depth relative to the call
        $arraysSeen = 0;
        $keys = [];

        for ($i = $openParenIndex; $i < $n; $i++) {
            $t = $tokens[$i];

            if ($t === '(') {
                $depth++;
                continue;
            }
            if ($t === ')') {
                $depth--;
                if ($depth === 0) {
                    break; // end of the call's argument list
                }
                continue;
            }

            // We only look at array literals that are direct arguments, i.e. an
            // opening bracket encountered while depth === 1.
            $isOpenBracket = ($t === '[')
                || (is_array($t) && $t[0] === T_ARRAY); // legacy array() — handled generically below

            if ($depth === 1 && $t === '[') {
                if ($arraysSeen >= $arraysWanted) {
                    // Skip this array entirely.
                    $i = $this->skipBracketArray($tokens, $i);
                    continue;
                }
                [$foundKeys, $endIndex] = $this->collectArrayKeys($tokens, $i);
                foreach ($foundKeys as $fk) {
                    $keys[] = $fk;
                }
                $arraysSeen++;
                $i = $endIndex;
                continue;
            }
        }

        return $keys;
    }

    /**
     * Collect top-level `'key' =>` string keys from a bracket array beginning
     * at $startIndex (which must be a `[`). Returns [keys, indexOfClosingBracket].
     *
     * @return array{0:string[],1:int}
     */
    private function collectArrayKeys(array $tokens, int $startIndex): array
    {
        $n = count($tokens);
        $bracketDepth = 0;
        $keys = [];

        for ($i = $startIndex; $i < $n; $i++) {
            $t = $tokens[$i];

            if ($t === '[') {
                $bracketDepth++;
                continue;
            }
            if ($t === ')') {
                // Unbalanced; stop defensively.
                return [$keys, $i];
            }
            if ($t === ']') {
                $bracketDepth--;
                if ($bracketDepth === 0) {
                    return [$keys, $i];
                }
                continue;
            }

            // Only inspect entries at the array's own top level.
            if ($bracketDepth !== 1) {
                continue;
            }

            // A key is a single-quoted / double-quoted string literal directly
            // followed (ignoring whitespace/comments) by `=>`.
            if (is_array($t) && $t[0] === T_CONSTANT_ENCAPSED_STRING) {
                $arrowIdx = $this->nextMeaningful($tokens, $i + 1);
                if ($arrowIdx !== null && is_array($tokens[$arrowIdx]) && $tokens[$arrowIdx][0] === T_DOUBLE_ARROW) {
                    $literal = $t[1];
                    // Strip surrounding quotes and unescape common sequences.
                    $key = $this->unquote($literal);
                    if ($key !== null && $key !== '') {
                        $keys[] = $key;
                    }
                }
            }
        }

        return [$keys, $n - 1];
    }

    /**
     * Skip an entire bracket array starting at a `[`; returns index of `]`.
     */
    private function skipBracketArray(array $tokens, int $startIndex): int
    {
        $n = count($tokens);
        $depth = 0;
        for ($i = $startIndex; $i < $n; $i++) {
            if ($tokens[$i] === '[') {
                $depth++;
            } elseif ($tokens[$i] === ']') {
                $depth--;
                if ($depth === 0) {
                    return $i;
                }
            }
        }
        return $n - 1;
    }

    /**
     * Convert a PHP string literal token into its value. Only handles plain
     * literals (no interpolation); returns null for anything with a variable.
     */
    private function unquote(string $literal): ?string
    {
        if (strlen($literal) < 2) {
            return null;
        }

        $quote = $literal[0];
        if ($quote !== "'" && $quote !== '"') {
            return null;
        }

        $inner = substr($literal, 1, -1);

        // Reject interpolated double-quoted strings — not a static key.
        if ($quote === '"' && preg_match('/\$\{?[a-zA-Z_]/', $inner)) {
            return null;
        }

        if ($quote === "'") {
            $inner = str_replace(["\\'", '\\\\'], ["'", '\\'], $inner);
        } else {
            $inner = str_replace(['\\"', '\\\\'], ['"', '\\'], $inner);
        }

        return $inner;
    }

    /**
     * Index of the next non-whitespace, non-comment token at/after $from.
     */
    private function nextMeaningful(array $tokens, int $from): ?int
    {
        $n = count($tokens);
        for ($i = $from; $i < $n; $i++) {
            $t = $tokens[$i];
            if (is_array($t) && in_array($t[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }
            return $i;
        }
        return null;
    }

    private function isDbFacade(string $className): bool
    {
        $className = ltrim($className, '\\');
        return $className === 'DB' 
            || $className === 'Illuminate\Support\Facades\DB' 
            || $className === 'Support\Facades\DB'
            || $className === 'Facades\DB';
    }

    private function findChainedWriteMethod(array $tokens, int $startIndex): ?array
    {
        $n = count($tokens);
        $i = $startIndex;

        while ($i < $n) {
            $i = $this->nextMeaningful($tokens, $i);
            if ($i === null) return null;

            if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_OBJECT_OPERATOR) {
                return null;
            }

            $methodIdx = $this->nextMeaningful($tokens, $i + 1);
            if ($methodIdx === null || !is_array($tokens[$methodIdx]) || $tokens[$methodIdx][0] !== T_STRING) {
                return null;
            }

            $methodName = $tokens[$methodIdx][1];

            $openParenIdx = $this->nextMeaningful($tokens, $methodIdx + 1);
            if ($openParenIdx === null || $tokens[$openParenIdx] !== '(') {
                return null;
            }

            if (in_array($methodName, ['insert', 'update', 'insertGetId', 'updateOrInsert'], true)) {
                return [$methodName, $openParenIdx];
            }

            $i = $this->skipMatchingParenthesis($tokens, $openParenIdx);
            if ($i === null) {
                return null;
            }
            $i++;
        }

        return null;
    }

    private function skipMatchingParenthesis(array $tokens, int $openParenIndex): ?int
    {
        $n = count($tokens);
        $depth = 0;
        for ($i = $openParenIndex; $i < $n; $i++) {
            if ($tokens[$i] === '(') {
                $depth++;
            } elseif ($tokens[$i] === ')') {
                $depth--;
                if ($depth === 0) {
                    return $i;
                }
            }
        }
        return null;
    }

    private function extractKeysFromDbWriteArgs(array $tokens, int $openParenIndex, int $arraysWanted): array
    {
        $n = count($tokens);
        $depth = 0;
        $arraysSeen = 0;
        $keys = [];

        for ($i = $openParenIndex; $i < $n; $i++) {
            $t = $tokens[$i];

            if ($t === '(') {
                $depth++;
                continue;
            }
            if ($t === ')') {
                $depth--;
                if ($depth === 0) {
                    break;
                }
                continue;
            }

            if ($depth === 1 && $t === '[') {
                if ($arraysSeen >= $arraysWanted) {
                    $i = $this->skipBracketArray($tokens, $i);
                    continue;
                }

                $next = $this->nextMeaningful($tokens, $i + 1);
                if ($next !== null && $tokens[$next] === '[') {
                    $outerEnd = $this->skipBracketArray($tokens, $i);
                    $j = $i + 1;
                    while ($j < $outerEnd) {
                        $j = $this->nextMeaningful($tokens, $j);
                        if ($j === null || $j >= $outerEnd) break;

                        if ($tokens[$j] === '[') {
                            [$foundKeys, $endIndex] = $this->collectArrayKeys($tokens, $j);
                            foreach ($foundKeys as $fk) {
                                $keys[] = $fk;
                            }
                            $j = $endIndex + 1;
                        } else {
                            $j++;
                        }
                    }
                    $i = $outerEnd;
                } else {
                    [$foundKeys, $endIndex] = $this->collectArrayKeys($tokens, $i);
                    foreach ($foundKeys as $fk) {
                        $keys[] = $fk;
                    }
                    $i = $endIndex;
                }

                $arraysSeen++;
                continue;
            }
        }

        return $keys;
    }
}
