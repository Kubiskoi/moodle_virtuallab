<!-- nacitanie css pre cast priebeh experimentu -->
<link rel="stylesheet" href="css/priebeh.css" type="text/css">

<div ng-show="isSectionShown('priebeh')" class="jh-section-content" ng-controller="PriebehCtrl">
	<div class="jh-section-wrapper">
		<h3>Priebeh experimentu</h3>
		<img ng-src="{{path_to_loading_gif}}loading.gif" ng-show="show_loading">
		<div class="jh-priebeh-graph_anim">
		<div ng-show="tableshow">
			<canvas ng-repeat="chart in charts" class="chart chart-line" chart-data="chart.data" chart-labels="chart.labels" chart-options="chart.options" chart-dataset-override="chart.datasetOverride"></canvas>
 		</div>
			
		</div>
		<div class="jh-priebeh-table">
			<div style="padding-right: 20px;">
					<table ng-show="tableshow" class="jh-table jh-table-output">
						<thead>
							<tr>
								<th ng-repeat="key in keys">{{key}}</th>
							</tr>
						</thead>
						<tbody>
							<tr ng-repeat="row in data_to_display">
								<td ng-repeat="(key,value) in row">{{value}}</td>
							</tr>
						</tbody>
					</table>
			</div>
		</div>
	</div>
</div>