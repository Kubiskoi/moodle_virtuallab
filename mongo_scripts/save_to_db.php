<?php
include 'mongodb_conf.php';


$result = $collection->insertOne( [ 'username' => $_POST["username"], 'experiment' => $_POST["experiment"],'executed' => $_POST["executed"] ]);

echo 200;
?>