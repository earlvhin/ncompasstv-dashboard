import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-billings',
  templateUrl: './billings.component.html',
  styleUrls: ['./billings.component.scss']
})
export class BillingsComponent implements OnInit {

	title: string = "Billings";
	billing_table_column = [
		'#',
		'Billing Date',
		'Dealer ID',
		'Business Name',
		'Unpaid',
		'Paid',
		'License(s)',
		'Total Billing',
		'Status'
	]

	billing_array = [
		{
			id: 123,
			i: 1,
			date: 'January 23, 2019',
			dealer_id: 'GDP-1000-2090',
			business: 'Guetamala Restaurant',
			unpaid: '$2,000',
			paid: '$2,500',
			license: '5',
			total: '$4,500',
			status: 'A'
		},
		{
			id: 123,
			i: 2,
			date: 'January 24, 2019',
			dealer_id: 'GDP-1000-2091',
			business: 'Guetamala Restaurant',
			unpaid: '$2,000',
			paid: '$2,500',
			license: '5',
			total: '$4,500',
			status: 'A'
		}
	]

	constructor() { }

	ngOnInit() {
	}

}
