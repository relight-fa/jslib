<?php
/*
 * パラメータに指定された時刻(Unix Timestamp milliseconds)まで待機する
 */
if (! isset($_GET["t"])) {
  exit;
}
$waitTime = 1000 * ((float)($_GET["t"]) - (microtime(true) * 1000)) ;

if ($waitTime > 10000000) { // 10 seconds = 10 * 1000 * 1000 usec
  exit;
}

usleep($waitTime);
