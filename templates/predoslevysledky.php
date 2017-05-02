<!-- nacitanie css pre cast predoslich vysledkov -->
<link rel="stylesheet" href="css/predoslevysledky.css" type="text/css">

<div ng-show="isSectionShown('predosle')" class="jh-section-content" ng-controller="PredosleVysledkyCtrl">
	<div class="jh-section-wrapper">
		<h3>Predošlé výsledky</h3>
		<br>
		<table class="jh-table">
			<thead>
				<tr>
					<th>Experiment</th>
					<th>Dátum simuláice</th>
					<th>Akcie</th>
					<th>Užívateľ</th>
				</tr>
			</thead>
			<tbody>
				<tr ng-repeat="experiment in data | orderBy:'-executed'">
					<td>{{experiment.experiment}}</td>
					<td>{{experiment.executed | date:'yyyy-MM-dd HH:mm'}}</td>	
					<td>
						<button class="actions_butt" ng-click="show_data(experiment._id)">Zobraz</button>
						<button class="actions_butt" ng-click="save_data(experiment._id,experiment.executed | date: 'yyyy-MM-dd HH:mm')">Ulož</button>
						<button class="actions_butt" ng-click="del_data(experiment._id,experiment.experiment,experiment.executed | date: 'yyyy-MM-dd HH:mm')">Vymaž</button>
					</td>	
					<td>{{experiment.username}}</td>
				</tr>
			</tbody>
		</table>		
	</div>
</div>