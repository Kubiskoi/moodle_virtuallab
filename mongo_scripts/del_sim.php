<?php
include 'mongodb_conf.php';

// http://stackoverflow.com/questions/7074309/find-a-document-with-objectid-in-mongodb
$result = $collection->deleteOne([ '_id' => new MongoDB\BSON\ObjectID( $_GET["id"] ) ]);

echo 200;
?>