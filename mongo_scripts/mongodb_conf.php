<?php
	$url = "mongodb://".$_GET["ipdb"].":".$_GET["portdb"];
	require  __DIR__ . '/vendor/autoload.php';
	$client = new MongoDB\Client($url);
	$collection = $client->virtuallab->experiments;
?>