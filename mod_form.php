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
 * The main virtuallab configuration form
 *
 * It uses the standard core Moodle formslib. For more info about them, please
 * visit: http://docs.moodle.org/en/Development:lib/formslib.php
 *
 * @package    mod_virtuallab
 * @copyright  2016 Your Name <your@email.address>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

/**
 * Module instance settings form
 *
 * @package    mod_virtuallab
 * @copyright  2016 Your Name <your@email.address>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_virtuallab_mod_form extends moodleform_mod {

    /**
     * Defines forms elements
     */
    public function definition() {
        global $CFG;

        $mform = $this->_form;


        //header je typ
        //exp_set je name podla dokumentacie
        //POZOR AK PRIDAME NOVE TREBA UPRAVIT lib.php funkcie add_instance a update_instance
        // $mform->addElement('header','exp_set',get_string('exp_set', 'virtuallab'));
        // $mform->addElement('advcheckbox', 'projectile',null,'Šikmý vrh', array('group' => 1));
        // $mform->addElement('advcheckbox', 'exp2',null,'Experiment 2', array('group' => 1));
        // $this->add_checkbox_controller(1);


        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('virtuallabname', 'virtuallab'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Adding the standard "intro" and "introformat" fields.
        if ($CFG->branch >= 29) {
            //toto
            $this->standard_intro_elements();
        } else {
            $this->add_intro_editor();
        }



        // $mform->addElement('text', 'mfilepar', 'Mfile for parameters');


        $mform->addElement('text', 'mfilepar', get_string('mfilepar_str', 'virtuallab'));
        $mform->addRule('mfilepar', null, 'required', null, 'client');

        // $mform->addElement('text', 'mfilescript', 'Mfile for script');
        $mform->addElement('text', 'mfilescript', get_string('mfilescript_str','virtuallab'));
        $mform->addRule('mfilescript', null, 'required', null, 'client');

        // $mform->addElement('text', 'foldername', 'Folder Name on server');
        $mform->addElement('text', 'foldername', get_string('foldername_str','virtuallab'));
        $mform->addRule('foldername', null, 'required', null, 'client');

        // $mform->addElement('text', 'ipadrs', 'IP Address of Matlab server');
        $mform->addElement('text', 'ipadrs', get_string('ipadrs_str','virtuallab'));
        $mform->addRule('ipadrs', null, 'required', null, 'client');

        // $mform->addElement('text', 'port', 'Port Matlab server');
        $mform->addElement('text', 'port', get_string('port_str','virtuallab'));
        $mform->addRule('port', null, 'required', null, 'client');

        // $mform->addElement('text', 'ipdb', 'IP Address of MongoDB');
        $mform->addElement('text', 'ipdb',get_string('ipdb_str','virtuallab') );
        $mform->addRule('ipdb', null, 'required', null, 'client');

        // $mform->addElement('text', 'portdb', 'Port MongoDB');
        $mform->addElement('text', 'portdb',  get_string('portdb_str','virtuallab') );
        $mform->addRule('portdb', null, 'required', null, 'client');

        // $mform->addElement('text', 'skipsamples', 'Skip Samples');
        $mform->addElement('text', 'skipsamples', get_string('skipsamples_str','virtuallab') );
        $mform->addRule('skipsamples', null, 'required', null, 'client');

        //typ, meno, label,Fourth element here is a string or array of attributes
        // $mform->addElement('textarea', 'inputs', 'Inputs', 'wrap="hard" rows="10" cols="50"');
        $mform->addElement('textarea', 'inputs', get_string('inputs_str','virtuallab'), 'wrap="hard" rows="10" cols="50"');
        $mform->addRule('inputs', null, 'required', null, 'client');
        //meno elementu na ktory sa viaze, v lang/eng $string['inputshelp'], meno komponentnu
        $mform->addHelpButton('inputs', 'inputshelp','virtuallab');

        // $mform->addElement('textarea', 'outputs', 'Outputs', 'wrap="hard" rows="10" cols="50"');
        $mform->addElement('textarea', 'outputs', get_string('outputs_str','virtuallab'), 'wrap="hard" rows="10" cols="50"');
        $mform->addRule('outputs', null, 'required', null, 'client');
        $mform->addHelpButton('outputs', 'outputshelp','virtuallab');


        

        // $mform->setDefault('mfilepar', 'Sikmy_vrh_par');
        // $mform->setDefault('mfilescript', 'projectile_sim');
        // $mform->setDefault('foldername', 'sikmy_vrh');
        // $mform->setDefault('ipadrs', 'localhost');
        // $mform->setDefault('port', '3001');
        // $mform->setDefault('ipdb', 'localhost');
        // $mform->setDefault('portdb', '27017');
        // $mform->setDefault('skipsamples', '20');



        
        // $mform->addHelpButton('name', 'virtuallabname', 'virtuallab');

        //tu si vyberie ucitel ktory experiment sa ma zobrazit
        //projectile je name podla dokumentacie
        //POZOR AK PRIDAME NOVE TREBA UPRAVIT lib.php funkcie add_instance a update_instance
        //POZOR ak chcem nastavit checkbox uz checknuty tak to ide cez $mform->setDefault('projectile',true);
        //ale funguje to len na checkbox, nefunguje to na advcheckbox
        // $mform->addElement('advcheckbox', 'projectile','Experimenty','Šikmý vrh', array('group' => 1));
        // $mform->addElement('advcheckbox', 'exp2',null,'Experiment 2', array('group' => 1));
        // $mform->addElement('advcheckbox', 'exp3',null,'Experiment 3', array('group' => 1));

        // $this->add_checkbox_controller(1);

        // Adding the rest of virtuallab settings, spreading all them into this fieldset
        // ... or adding more fieldsets ('header' elements) if needed for better logic.
        // $mform->addElement('static', 'label1', 'virtuallabsetting1', 'Your virtuallab fields go here. Replace me!');

        // $mform->addElement('header', 'virtuallabfieldset', get_string('virtuallabfieldset', 'virtuallab'));
        // $mform->addElement('static', 'label2', 'virtuallabsetting2', 'Your virtuallab fields go here. Replace me!');

        // Add standard grading elements.
        // $this->standard_grading_coursemodule_elements();

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();

        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }
}
