<!-- nacitanie css pre cast predoslich vysledkov -->
<!-- <link rel="stylesheet" href="css/predoslevysledky.css" type="text/css">
 -->
<div ng-show="isSectionShown('predosle')" class="jh-section-content" ng-controller="PredosleVysledkyCtrl">
	<div class="jh-section-wrapper">
		<h3>Predošlé výsledky</h3>
		<br>
		<table class="jh-table">
			<thead>
				<tr>
					<th>Experiment</th>
					<th>Dátum</th>
					<th>Akcie</th>
					<th>user</th>
				</tr>
			</thead>
			<tbody>
				<tr ng-repeat="experiment in data | orderBy:'-executed'">
					<td>{{experiment.experiment}}</td>
					<td>{{experiment.executed | date: 'dd.MM.yyyy hh:mm'}}</td>	
					<td>x</td>	
					<td>{{experiment.username}}</td>
				</tr>
			</tbody>
		</table>		
	</div>
</div>