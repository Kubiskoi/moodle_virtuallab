<?php

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = $_GET['id'];

    $cm         = get_coursemodule_from_id('virtuallab', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $virtuallab  = $DB->get_record('virtuallab', array('id' => $cm->instance), '*', MUST_EXIST);

    $obj = new stdClass();
    $obj->username = $USER->username;
    $obj->mfilepar = $virtuallab->mfilepar;
    $obj->mfilescript = $virtuallab->mfilescript;
    $obj->ipadrs = $virtuallab->ipadrs;
    $obj->port = $virtuallab->port;
    $obj->foldername = $virtuallab->foldername;
    $obj->portdb = $virtuallab->portdb;
    $obj->ipdb = $virtuallab->ipdb;
    $obj->inputs = $virtuallab->inputs;
    $obj->outputs = $virtuallab->outputs;



echo json_encode($obj);