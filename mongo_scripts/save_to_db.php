<?php
include 'mongodb_conf.php';
// $arrayname[indexname] = $value;

$toSave = array('username' => $_POST["username"], 'experiment' => $_POST["experiment"],'executed' => $_POST["executed"],'keys' => $_POST["keys"]);

foreach ($_POST["keys"] as $key) {
	$toSave[$key]=$_POST[$key];
}




$result = $collection->insertOne($toSave);

echo 200;
?>