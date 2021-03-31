import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
	selector: 'app-reports',
	templateUrl: './reports.component.html',
	styleUrls: ['./reports.component.scss']
})

export class ReportsComponent implements OnInit {

	title: string = "Reports";

	constructor() { }

	ngOnInit() {
		this.incomeReport();
		this.dealerReport();
		this.salesReport();
		this.billsReport();
		Chart.defaults.global.defaultFontFamily = 'Poppins';
		Chart.defaults.global.defaultFontSize = 12;
		Chart.defaults.global.defaultFontStyle = '600';
	}

	incomeReport() {
		var canvas = < HTMLCanvasElement > document.getElementById('myChart');
		var ctx = canvas.getContext('2d');
		var chart = new Chart(ctx, {
			// The type of chart we want to create
			type: 'line',
	
			// The data for our dataset
			data: {
			labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
			datasets: [{
				label: 'Income',
				backgroundColor: 'rgb(142, 198, 65)',
				borderColor: 'rgb(64, 109, 2)',
				data: [0, 10, 5, 2, 20, 30, 45]
			}]
			},
	
			// Configuration options go here
			options: {
			title: {
				display: true,
				text: 'Income Report',
				fontSize: 18,
				fontStyle: '600'
			}
			}
		});
		}
	
		dealerReport() {
		var canvas = < HTMLCanvasElement > document.getElementById('myChartDealer');
		var ctx = canvas.getContext('2d');
		var chart = new Chart(ctx, {
			// The type of chart we want to create
			type: 'line',
	
			// The data for our dataset
			data: {
			labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
			datasets: [{
				label: 'Dealers',
				backgroundColor: 'rgb(255, 99, 132)',
				borderColor: 'rgb(255, 75, 100)',
				data: [15, 0, 5, 5, 17, 20, 15]
			}]
			},
	
			// Configuration options go here
			options: {
			title: {
				display: true,
				text: 'Dealer Report',
				fontSize: 18,
				fontStyle: '600'
			}
			}
		});
		}
	
		salesReport() {
		var canvas = < HTMLCanvasElement > document.getElementById('myChartReports');
		var ctx = canvas.getContext('2d');
		var stackedBar = new Chart(ctx, {
			type: 'bar',
			data: {
			labels: ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford'],
			datasets: [{
				label: 'Sales',
				data: [
				417594,
				481045,
				453060,
				436519,
				605162,
				550721
				],
				backgroundColor: [
				'rgb(255, 99, 132)',
				'rgb(0, 123, 255)',
				'rgb(142, 198, 65)',
				'rgb(111, 66, 193)',
				'rgb(253, 126, 20)',
				'rgb(0, 123, 255)'
				],
				borderWidth: 2,
				borderColor: '#bbb',
				hoverBorderColor: '#777'
	
				// backgroundColor: 'rgb(255, 99, 132)'
			}]
			},
			options: {
			title: {
				display: true,
				text: 'Sales Income Reports',
				fontSize: 18
			}
			}
		});
		}
	
		billsReport() {
		var canvas = < HTMLCanvasElement > document.getElementById('myChartBills');
		var ctx = canvas.getContext('2d');
		var stackedBar = new Chart(ctx, {
			type: 'bar',
			data: {
			labels: ['2011', '2012', '2013', '2014', '2015', '2016'],
			datasets: [{
				label: 'Bills',
				data: [
				317594,
				281045,
				353060,
				506519,
				405162,
				550721
				],
				backgroundColor: [
				'rgb(255, 99, 132)',
				'rgb(0, 123, 255)',
				'rgb(142, 198, 65)',
				'rgb(111, 66, 193)',
				'rgb(253, 126, 20)',
				'rgb(0, 123, 255)'
				],
				borderWidth: 2,
				borderColor: '#bbb',
				hoverBorderColor: '#777'
	
				// backgroundColor: 'rgb(255, 99, 132)'
			}]
			},
			options: {
			title: {
				display: true,
				text: 'Bills Reports',
				fontSize: 18,
				fontStyle: '600'
			}
			}
		});
		}

}
