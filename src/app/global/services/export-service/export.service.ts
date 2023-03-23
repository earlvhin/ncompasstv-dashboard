import { Injectable } from '@angular/core';
import { Buffer, Column, Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

import { WORKSHEET } from 'src/app/global/models';

@Injectable({
	providedIn: 'root'
})
export class ExportService {
	constructor() {}

	async generate(pageSource: string, worksheets: WORKSHEET[]) {
		const workbook = new Workbook();
		workbook.creator = 'NCompass TV';
		workbook.created = new Date();

		const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

		worksheets.forEach((sheet) => {
			let rowIndex = 1;
			const worksheet = workbook.addWorksheet(sheet.name);
			worksheet.columns = this.mapColumns(sheet.columns);
			sheet.data.forEach((cellData) => (worksheet.addRow(cellData).font = { bold: false }));

			for (rowIndex; rowIndex <= worksheet.rowCount; rowIndex++) {
				worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
			}
		});

		const file: Buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([file], { type: EXCEL_TYPE });
		const timestamp = moment().format('YYYY-DD-MM-hhssmm');
		const fileName = `${pageSource}-${timestamp}.xlsx`;
		saveAs(blob, fileName);
	}

	private mapColumns(data: { name: string; key: string }[]): Column[] {
		return data.map((column) => {
			const header = column.name;
			const key = column.key;
			const width = 30;
			const outlineLevel = 1;
			const hidden = false;
			const style = { font: { name: 'Arial', bold: true } };
			return { header, key, width, outlineLevel, hidden, style } as Column;
		});
	}
}
