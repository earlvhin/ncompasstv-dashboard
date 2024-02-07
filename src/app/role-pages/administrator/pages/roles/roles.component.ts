import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { RoleService } from 'src/app/global/services';
import { USER_ROLE } from 'src/app/global/models';

@Component({
    selector: 'app-roles',
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.scss'],
})
export class RolesComponent implements OnInit {
    title: string = 'Roles';
    roles$: Observable<USER_ROLE[]>;
    roles_array: Array<any> = [];

    compare = {
        basis: 900,
        basis_label: 'Dealers',
        good_value: 794,
        good_value_label: 'Active',
        bad_value: 106,
        bad_value_label: 'Inactive',
    };

    count_1 = {
        data_value: 23,
        data_label: 'Dealers',
        data_description: 'New This Week',
    };

    count_2 = {
        data_value: 14,
        data_label: 'Dealers',
        data_description: 'New Last Week',
    };

    count_3 = {
        data_value: 14,
        data_label: 'Installed',
        data_description: 'Installed This Week',
    };

    count_4 = {
        data_value: 10,
        data_label: 'Installed',
        data_description: 'Installed Last Week',
    };

    roles_table_column: string[] = ['#', 'Role Name'];

    constructor(private _role: RoleService) {}

    ngOnInit() {
        this.getAllRoles();
    }

    getAllRoles() {
        this.roles$ = this._role.get_roles();

        this.roles$.subscribe((data) => {
            let counter = 1;

            data.forEach((r) => {
                const user_role = {
                    id: r.roleId,
                    count: counter,
                    role_name: r.roleName,
                };

                this.roles_array.push(user_role);

                counter++;
            });
        });
    }
}
