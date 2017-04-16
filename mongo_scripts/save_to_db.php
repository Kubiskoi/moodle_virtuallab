<?php
include 'mongodb_conf.php';

//http://stackoverflow.com/questions/18866571/receive-json-post-with-php
$data = json_decode(file_get_contents('php://input'), true);

$toSave = array('username' => $data["username"], 'experiment' => $data["experiment"],'executed' => $data["executed"],'keys' => $data["keys"]);
foreach ($data["keys"] as $key) {
	$toSave[$key]=$data[$key];
}


// jqlike
// $toSave = array('username' => $_POST["username"], 'experiment' => $_POST["experiment"],'executed' => $_POST["executed"],'keys' => $_POST["keys"]);

// foreach ($_POST["keys"] as $key) {
// 	$toSave[$key]=$_POST[$key];
// }




$result = $collection->insertOne($toSave);

echo 200;
?>