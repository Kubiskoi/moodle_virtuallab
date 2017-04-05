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
			<form novalidate="">
				<input ng-repeat-start="input in inputs" type="number" name={{input.name}} placeholder="{{input.label}}" ng-value="{{input.init}}">
				<br ng-repeat-end>
				<input type="submit" ng-click="odosli()" value="Save"/>
			</form>
		</div>
	</div>
</div>