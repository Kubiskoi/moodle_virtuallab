<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Prints a particular instance of virtuallab
 *
 * You can have a rather longer description of the file as well,
 * if you like, and it can span multiple lines.
 *
 * @package    mod_virtuallab
 * @copyright  2016 Your Name <your@email.address>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Replace virtuallab with the name of your module and remove this line.
require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

$id = optional_param('id', 0, PARAM_INT); // Course_module ID, or
$n  = optional_param('n', 0, PARAM_INT);  // ... virtuallab instance ID - it should be named as the first character of the module.

if ($id) {
    $cm         = get_coursemodule_from_id('virtuallab', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $virtuallab  = $DB->get_record('virtuallab', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $virtuallab  = $DB->get_record('virtuallab', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $virtuallab->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('virtuallab', $virtuallab->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}


require_login($course, true, $cm);

$event = \mod_virtuallab\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $virtuallab);
$event->trigger();

// Print the page header.

$PAGE->set_url('/mod/virtuallab/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($virtuallab->name));
$PAGE->set_heading(format_string($course->fullname));

/*
 * Other things you may want to set - remove if not needed.
 * $PAGE->set_cacheable(false);
 * $PAGE->set_focuscontrol('some-html-id');
 * $PAGE->add_body_class('virtuallab-'.$somevar);
 */

// Output starts here.
echo $OUTPUT->header();


// Conditions to show the intro can change to look for own settings or whatever.
// if ($virtuallab->intro) {
//     echo $OUTPUT->box(format_module_intro('virtuallab', $virtuallab, $cm->id), 'generalbox mod_introbox', 'virtuallabintro');
// }


// Replace the following lines with you own code.
// echo $OUTPUT->heading('Yay! It works!2');


//nacitanie angularu a dalsich js suborov, rand je tam preto aby sa neukladali do cache a videl som zmeny, lebo chrome si cacheoval a zmeny v kode sa neprejavovali
// $PAGE->requires->js('/mod/virtuallab/js/lib/socketio.min.js');
echo '<script type="text/javascript" src="/mod/virtuallab/js/lib/socketio.min.js"></script>';
$PAGE->requires->js('/mod/virtuallab/js/lib/angular.min.js');
$PAGE->requires->js('/mod/virtuallab/js/src/app.js?ver='.rand());
$PAGE->requires->js('/mod/virtuallab/js/src/factories.js?ver='.rand());
$PAGE->requires->js('/mod/virtuallab/js/src/controllers.js?ver='.rand());



//vlozi HTML strukturu
require_once('templates/lab_template.php');


// Finish the page.
echo $OUTPUT->footer();
