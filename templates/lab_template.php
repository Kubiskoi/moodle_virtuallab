<?php
// echo $USER->username.'<br>';
// echo $CFG->wwwroot;
// echo '<div id="kone">'.$CFG->wwwroot.'</div>';
// var_dump(phpversion("mongodb"));
// phpinfo();

// echo '<div id="jh-logged-user" hidden>'.$USER->username.'</div>';
// echo '<div id="jh-mfilepar" hidden>'.$virtuallab->mfilepar.'</div>';
// echo '<div id="jh-mfilescript" hidden>'.$virtuallab->mfilescript.'</div>';
// echo '<div id="jh-ipadrs" hidden>'.$virtuallab->ipadrs.'</div>';
// echo '<div id="jh-port" hidden>'.$virtuallab->port.'</div>';
// echo '<div id="jh-foldername" hidden>'.$virtuallab->foldername.'</div>';
// echo '<div id="jh-portdb" hidden>'.$virtuallab->portdb.'</div>';
// echo '<div id="jh-ipdb" hidden>'.$virtuallab->ipdb.'</div>';
// echo '<div id="jh-inputs" hidden>'.$virtuallab->inputs.'</div>';
// echo '<div id="jh-outputs" hidden>'.$virtuallab->outputs.'</div>';




?>

<!-- nacitanie css pre navigacnu cast -->
<link rel="stylesheet" href="css/nav.css" type="text/css">
<!-- nacitanie css pre sekcie -->
<link rel="stylesheet" href="css/section-common.css" type="text/css">



<div ng-app="myApp" ng-controller="SectionCtrl" class="jh-wrapper" ">
	<div class="jh-nav-menu" ">
<!-- 		<p>
			<button ng-class="{'jh-nav-button-selected':isSectionShown('uvod')}" class="jh-nav-button" ng-click="ShowSection('uvod')">Laboratórium</button>
		</p>
 -->		
 		<p>
			<button ng-class="{'jh-nav-button-selected':isSectionShown('experiment')}" class="jh-nav-button" ng-click="ShowSection('experiment')"><?php echo $virtuallab->name;?></button>
		</p>
		<p>
			<button ng-class="{'jh-nav-button-selected':isSectionShown('priebeh')}" class="jh-nav-button" ng-click="ShowSection('priebeh')">Priebeh Experimentu</button>
		</p>
		<p
			><button ng-class="{'jh-nav-button-selected':isSectionShown('predosle')}" class="jh-nav-button" ng-click="ShowSection('predosle')">Predošlé Simulácie</button>
		</p>
	</div>
	


	<?php
		// require('laboratorium.php');
		require('experiment.php');
		require('priebeh.php');
		require('predoslevysledky.php');
	?>
	
</div>