<?php

namespace App\Engines;

use Illuminate\Support\Facades\DB;

class CapabilityDependencyResolver
{
    /**
     * Resolve the complete list of enabled capability keys,
     * traversing requirements and pruning conflicts.
     *
     * @param  array  $enabledKeys  List of explicitly requested keys
     * @return array                Resolved and conflict-free active keys
     */
    public function resolve(array $enabledKeys): array
    {
        // 1. Fetch all capabilities with requires/conflicts
        $capabilities = DB::table('capabilities')
            ->get(['key', 'requires', 'conflicts'])
            ->keyBy('key');

        $resolved = [];
        $queue = $enabledKeys;
        $visited = [];

        // 2. Resolve dependencies (BFS traversal)
        while (!empty($queue)) {
            $key = array_shift($queue);
            if (in_array($key, $visited, true)) {
                continue;
            }
            $visited[] = $key;

            $cap = $capabilities->get($key);
            if (!$cap) {
                // If not in registry, still keep it if explicitly requested (fallback)
                if (in_array($key, $enabledKeys, true)) {
                    $resolved[$key] = true;
                }
                continue;
            }

            $resolved[$key] = true;

            // Add requirements to the queue
            if ($cap->requires) {
                $reqs = is_string($cap->requires) ? json_decode($cap->requires, true) : $cap->requires;
                if (is_array($reqs)) {
                    foreach ($reqs as $req) {
                        $queue[] = $req;
                    }
                }
            }
        }

        // 3. Handle conflicts
        $finalResolved = $resolved;
        foreach (array_keys($resolved) as $key) {
            if (!isset($finalResolved[$key])) {
                continue;
            }
            $cap = $capabilities->get($key);
            if ($cap && $cap->conflicts) {
                $conflicts = is_string($cap->conflicts) ? json_decode($cap->conflicts, true) : $cap->conflicts;
                if (is_array($conflicts)) {
                    foreach ($conflicts as $conflict) {
                        if (isset($finalResolved[$conflict])) {
                            // If the conflicting key was NOT explicitly requested, prune it.
                            // Otherwise, if both were explicitly requested, prune the conflicting one.
                            if (!in_array($conflict, $enabledKeys, true)) {
                                unset($finalResolved[$conflict]);
                            } elseif (!in_array($key, $enabledKeys, true)) {
                                unset($finalResolved[$key]);
                            } else {
                                unset($finalResolved[$conflict]);
                            }
                        }
                    }
                }
            }
        }

        return array_keys($finalResolved);
    }
}
