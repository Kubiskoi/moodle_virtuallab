<!-- nacitanie css pre cast priebeh experimentu -->
<link rel="stylesheet" href="css/priebeh.css" type="text/css">

<div ng-show="isSectionShown('priebeh')" class="jh-section-content" ng-controller="PriebehCtrl">
	<div class="jh-section-wrapper">
		<h3>Priebeh experimentu</h3>
		<img ng-src="{{path_to_loading_gif}}loading.gif" ng-show="show_loading">
		<div class="jh-priebeh-graph_anim">
		<p>graf a anim</p>
			
		</div>
		<div class="jh-priebeh-table">
			<div style="padding-right: 20px;">
					<table ng-show="tableshow" class="jh-table jh-table-output">
						<thead>
							<tr>
								<th>t</th>
								<th>x</th>
								<th>y</th>
								<th>v</th>
							</tr>
						</thead>
						<tbody>
							<tr ng-repeat="val in vt track by $index">
								<td>{{val}}</td>
								<td>{{vx[$index]}}</td>
								<td>{{vy[$index]}}</td>
								<td>{{vv[$index]}}</td>
							</tr>
			<!-- 				<tr ng-repeat="val in t track by $index">
								<td>{{val}}</td>
								<td>{{x[$index]}}</td>
								<td>{{y[$index]}}</td>
								<td>{{v[$index]}}</td>
							</tr>
			 -->			</tbody>

					</table>
			</div>
		</div>
	</div>
</div>