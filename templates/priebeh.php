<!-- nacitanie css pre cast priebeh experimentu -->
<!-- <link rel="stylesheet" href="css/priebeh.css" type="text/css">
 -->
<div ng-show="isSectionShown('priebeh')" class="jh-section-content" ng-controller="PriebehCtrl">
	<div class="jh-section-wrapper">
		<h3>Priebeh experimentu</h3>
		<table class="jh-predosle-vysledky">
			<thead>
				<tr>
					<th>t</th>
					<th>x</th>
					<th>y</th>
					<th>v</th>
				</tr>
			</thead>
			<tbody>
				<tr ng-repeat="val in data">
					<td>{{val.t}}</td>
					<td>{{val.x}}</td>
					<td>{{val.y}}</td>
					<td>{{val.v}}</td>
				</tr>
			</tbody>

		</table>
		<img ng-src="{{path_to_loading_gif}}loading.gif" ng-show="show_loading">
	</div>
</div>