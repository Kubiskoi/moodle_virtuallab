<?php
include 'mongodb_conf.php';

// require '/Applications/MAMP/bin/php/php5.6.30/bin/vendor/autoload.php';
// require  __DIR__ . '/../../../vendor/autoload.php';
// $client = new MongoDB\Client("mongodb://localhost:27017");

$query = array('username' => $_GET["username"],'experiment' => $_GET["expname"]);
$result = $collection->find($query);


$resp = array();
foreach ($result as $entry) {
    // var_dump();
    // break;
    // if($_GET["username"] == $entry['username'] && $_GET["expname"] == $entry['experiment']){
        $genericObject = new stdClass();
        $genericObject->_id = (string)$entry['_id'];
        $genericObject->username = $entry['username'];
        $genericObject->experiment = $entry['experiment'];
        $genericObject->executed = $entry['executed'];
        $genericObject->keys = $entry['keys'];
        foreach($entry['keys'] as $key){
            $genericObject->$key = $entry[$key];
        }
        // $genericObject->xdata = $entry['xdata']['time'];
        // $genericObject->x = $entry['x'];
        // $genericObject->vy = $entry['vy'];
        // $genericObject->y = $entry['y'];
    
        array_push($resp,$genericObject);
    // }
}

echo json_encode($resp);
?>