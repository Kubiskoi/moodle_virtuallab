<!-- nacitanie css pre cast experiment-->
<link rel="stylesheet" href="css/experiment.css" type="text/css">

<div ng-show="isSectionShown('experiment')" class="jh-section-content" ng-controller="ExperimentCtrl">
	<div class="jh-section-wrapper">
		<div class="jh-experiment-text">
			<h3>Experiment - <?php echo $virtuallab->name;?></h3> 
			<?php
				if ($virtuallab->intro) {
				    echo $OUTPUT->box(format_module_intro('virtuallab', $virtuallab, $cm->id), 'generalbox mod_introbox', 'virtuallabintro');
				}
			?>

		</div>
		<div class="jh-experiment-input">
			<h3>Vstupy</h3>
			<p ng-show="wrong_input_format_notice_show">Inpust incorrectly formatted!</p>
			<form name="jh_inpust_form" ng-submit="submit_input_form(jh_inpust_form)">
				<input ng-repeat-start="input in inputs" type="number" name={{input.name}} placeholder="{{input.label}}" ng-value="{{input.init}}" min="{{input.min}}" max="{{input.max}}" step=any required>
				<br ng-repeat-end>
				<input ng-show="submitbu_show" type="submit" value="Save"/>
			</form>
		</div>
	</div>
</div>