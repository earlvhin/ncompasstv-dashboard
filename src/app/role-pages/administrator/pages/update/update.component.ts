import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UpdateService } from 'src/app/global/services/update-service/update.service';

interface App {
	appDescription: string;
	appId: string;
	appName: string;
	currentVersion: string;
	dateCreated: string;
	dateUpdated: string;
	githubUrl: string;
}

@Component({
	selector: 'app-update',
	templateUrl: './update.component.html',
	styleUrls: ['./update.component.scss']
})
export class UpdateComponent implements OnInit {
	app_form: FormGroup;
	apps: App[] = [];
	app_versions: any[] = [];
	all_app_versions: any[] = [];
	app_form_disabled: boolean = true;
	add_app_form: FormGroup;
	add_app_form_disabled: boolean = true;
	delete_app_form: FormGroup;
	delete_app_version_form: FormGroup;
	delete_app_version_form_disabled: boolean = true;
	delete_app_form_disabled: boolean = true;

	constructor(private _form: FormBuilder, private _updates: UpdateService) {}

	ngOnInit() {
		this.getApps();

		this.app_form = this._form.group({
			appId: ['', Validators.required],
			version: ['', Validators.required],
			releaseNotes: ['', Validators.required],
			zipUrl: ['', Validators.required]
		});

		this.add_app_form = this._form.group({
			appName: ['', Validators.required],
			appDescription: ['', Validators.required],
			githubUrl: ['', Validators.required]
		});

		this.delete_app_form = this._form.group({
			appId: ['', Validators.required]
		});

		this.delete_app_version_form = this._form.group({
			versionId: ['', Validators.required]
		});

		this.delete_app_form.valueChanges.subscribe(() => {
			if (this.delete_app_form.valid) {
				this.delete_app_form_disabled = false;
			} else {
				this.delete_app_form_disabled = true;
			}
		});

		this.delete_app_version_form.valueChanges.subscribe(() => {
			if (this.delete_app_version_form.valid) {
				this.delete_app_version_form_disabled = false;
			} else {
				this.delete_app_version_form_disabled = true;
			}
		});

		this.app_form.valueChanges.subscribe(() => {
			if (this.app_form.valid) {
				this.app_form_disabled = false;
			} else {
				this.app_form_disabled = true;
			}
		});

		this.add_app_form.valueChanges.subscribe(() => {
			if (this.add_app_form.valid) {
				this.add_app_form_disabled = false;
			} else {
				this.add_app_form_disabled = true;
			}
		});
	}

	addVersion() {
		this._updates.add_app_version(this.app_form.value).subscribe(() => {
			this.app_form.reset();
			this.app_form_disabled = true;
			this.ngOnInit();
		});
	}

	addApp() {
		this._updates.add_app(this.add_app_form.value).subscribe((data) => {
			this.add_app_form.reset();
			this.add_app_form_disabled = true;
			this.ngOnInit();
		});
	}

	deleteApp() {
		const app = this.delete_app_form.value;
		this._updates.remove_app([app.appId]).subscribe(() => {
			this.delete_app_form.reset();
			this.delete_app_form_disabled = true;
			this.ngOnInit();
		});
	}

	deleteAppVersion() {
		const app = this.delete_app_version_form.value;

		this._updates.remove_app_version([app.versionId]).subscribe(() => {
			this.delete_app_form.reset();
			this.delete_app_form_disabled = true;
			this.ngOnInit();
		});
	}

	getApps() {
		this._updates.get_apps().subscribe(async (data: App[]) => {
			if (data.length > 0) {
				this.apps = data;
				this.apps.map((i: App) => {
					return this.getAppVersion(i);
				});
			}

			this.getAppVersions();
		});
	}

	getAppVersion(app: App) {
		this.app_versions = [];

		this._updates.get_app_version(app.appId).subscribe((data) => {
			this.app_versions.push({
				appName: app.appName,
				appVersionInfo: data[0]
			});
		});
	}

	getAppVersions() {
		this._updates.get_app_versions().subscribe(
			(data: any[]) => {
				data.map((i) => {
					this.all_app_versions.push({
						versionId: i.versionId,
						appId: i.appId,
						version: i.version,
						appName: this.apps.filter((j) => i.appId === j.appId)[0].appName
					});
				});
			},
			(error) => {
				console.error(error);
			}
		);
	}
}
