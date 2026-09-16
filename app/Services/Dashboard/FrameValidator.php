<?php

namespace App\Services\Dashboard;

use App\Reckoner\LayoutLaw;
use Illuminate\Validation\ValidationException;

final class FrameValidator
{
    /** @return list<string> */
    public function problems(array $frame): array
    {
        $slots = array_values($frame['slots'] ?? []);
        $problems = [];

        if (count($slots) < 1 || count($slots) > 40) {
            $problems[] = 'A frame must contain between 1 and 40 slots.';
        }

        $rows = 0;
        $grid = [];
        $slotIds = [];

        foreach ($slots as $index => $slot) {
            $id = (int) ($slot['slot'] ?? $index + 1);
            $x = (int) ($slot['x'] ?? -1);
            $y = (int) ($slot['y'] ?? -1);
            $w = (int) ($slot['w'] ?? 0);
            $h = (int) ($slot['h'] ?? 0);
            $slotIds[] = $id;

            if ($x < 0 || $y < 0 || $w < 1 || $h < 1 || $x + $w > LayoutLaw::columns()) {
                $problems[] = "Slot {$id} overflows the 12-column grid or has invalid coordinates.";
                continue;
            }

            $rows = max($rows, $y + $h);
            for ($row = $y; $row < $y + $h; $row++) {
                for ($column = $x; $column < $x + $w; $column++) {
                    if (isset($grid[$row][$column])) {
                        $problems[] = "Slot {$id} overlaps slot {$grid[$row][$column]} at row {$row}, col {$column}.";
                    }
                    $grid[$row][$column] = $id;
                }
            }

            $category = (string) ($slot['category'] ?? '');
            $fit = LayoutLaw::findFit($category, $slot['fit'] ?? null);
            if ($fit === null || (int) $fit['w'] !== $w || (int) $fit['h'] !== $h) {
                $problems[] = "Slot {$id} is not an exact declared fit for {$category}.";
            }
        }

        for ($row = 0; $row < $rows; $row++) {
            for ($column = 0; $column < LayoutLaw::columns(); $column++) {
                if (! isset($grid[$row][$column])) {
                    $problems[] = "Hole at row {$row}, col {$column}.";
                }
            }
        }

        if (isset($frame['rows']) && (int) $frame['rows'] !== $rows) {
            $problems[] = "Declared row count {$frame['rows']} does not match geometry row count {$rows}.";
        }

        $accent = $frame['accent_slot'] ?? null;
        if ($accent !== null && ! in_array((int) $accent, $slotIds, true)) {
            $problems[] = "Accent slot {$accent} does not exist.";
        }

        return array_values(array_unique($problems));
    }

    public function validate(array $frame): array
    {
        $problems = $this->problems($frame);
        if ($problems !== []) {
            throw ValidationException::withMessages(['slots' => $problems]);
        }

        return $frame;
    }
}
