<?php
foreach (app('router')->getRoutes() as $r) { if (!in_array('GET',$r->methods())) continue; $u=$r->uri(); if (!str_starts_with($u,'s/{store_slug}')) continue; if (str_contains($u,'{') && substr_count($u,'{')>1) continue; echo str_replace('s/{store_slug}','',$u)."\n"; }
