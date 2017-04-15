<!-- nacitanie css pre cast experiment-->
<link rel="stylesheet" href="css/experiment.css" type="text/css">

<div ng-show="isSectionShown('experiment')" class="jh-section-content" ng-controller="ExperimentCtrl">
	<div class="jh-section-wrapper">
		<div class="jh-experiment-text">
			<h3>Experiment - <?php echo $virtuallab->name;?></h3> 
			<button ng-click="testbut()">test</button>
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
				<ul class="form-style-1">
					<li ng-repeat-start="input in inputs">
						<label>{{input.label}} <span class="required">*</span></label>
						<input class="field-divided"  type="number" name={{input.name}} placeholder="<{{input.min}},{{input.max}}>" ng-value="{{input.init}}" min="{{input.min}}" max="{{input.max}}" step=any required>
					</li>
					<div ng-repeat-end></div>
				<li>
					<input ng-show="submitbu_show" type="submit" value="Spustiť"/>
				</li>
				</ul>
			</form>
		</div>
	</div>
</div>