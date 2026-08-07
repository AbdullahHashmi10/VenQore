<?php
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator('d:/AMD POS/app'));
foreach($files as $f) {
  if($f->getExtension() == 'php'){
    $lines = file($f->getPathname());
    foreach($lines as $i => $line){
      if(strpos($line, '::all()') !== false){
        if(!preg_match('/HasTenant|Tenant::all|Permission::all|Role::all|Currency::all|Unit::all|Setting::all/', $line)){
          echo $f->getPathname() . ':' . ($i+1) . ' ' . trim($line) . "\n";
        }
      }
    }
  }
}
