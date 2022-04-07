import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { stringify } from 'querystring';

@Component({
  selector: 'app-installation-tab',
  templateUrl: './installation-tab.component.html',
  styleUrls: ['./installation-tab.component.scss']
})

export class InstallationTabComponent implements OnInit {
    form: FormGroup;
    task_items: any = [];
    section_title: any;
    
    constructor(
        private fb: FormBuilder
    ) {
        this.form = this.fb.group({
            published: true,
            categoryName: '',
            tasks: this.fb.array([]),
          });
    }

    ngOnInit() {
    }

    saveTitle() {
        this.section_title = this.form.controls.categoryName.value;
        console.log("CAT",this.form.controls.categoryName.value)
    }

    addTaskItems() {
        this.task_items = this.form.controls.tasks as FormArray;
        this.task_items.push(this.fb.group({
          task: '',
        }));
    }

    removeTaskItems(index) {
        this.task_items.removeAt(index);
    }

    getFormValues() {
        console.log("TASKS", this.task_items)
    }
}
