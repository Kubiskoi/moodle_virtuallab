<?php
include 'mongodb_conf.php';

$result = $collection->deleteOne([ '_id' => new MongoDB\BSON\ObjectID( $_GET["id"] ) ]);

echo 200;
?>