import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-remote-terminal',
    templateUrl: './remote-terminal.component.html',
    styleUrls: ['./remote-terminal.component.scss'],
})
export class RemoteTerminalComponent implements OnInit {
    script = '';
    enteredScripts = [];
    @Output() run: EventEmitter<string> = new EventEmitter();

    constructor() {}

    ngOnInit() {}

    submitTerminalCommand(): void {
        if (!this.script) return;
        this.enteredScripts.push(this.script);
        this.run.emit(this.script);
        this.script = '';
    }
}
