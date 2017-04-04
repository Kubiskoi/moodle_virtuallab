<!-- nacitanie css pre cast opisu laboratoria -->
<link rel="stylesheet" href="css/lab.css" type="text/css">

<div ng-show="isSectionShown('uvod')" class="jh-section-content">
	<div class="jh-section-wrapper">
		<h3> Virtuálne Laboratórium</h3>
		<p>
			<?php
				if ($virtuallab->intro) {
				    echo $OUTPUT->box(format_module_intro('virtuallab', $virtuallab, $cm->id), 'generalbox mod_introbox', 'virtuallabintro');
				}
			?>
		</p>
	</div>
</div>