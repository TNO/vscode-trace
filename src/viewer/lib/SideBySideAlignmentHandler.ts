import { RefObject } from 'react';
import LogViewAndMinimap from '../components/LogViewAndMinimap';
import { LogViewState } from '../interfaces';
import { enums } from '../enums';

export default class SideBySideAlignmentHandler {
    
    private readonly primaryView: RefObject<LogViewAndMinimap>;
    private readonly comparisonView: RefObject<LogViewAndMinimap>;

    private syncronizeScroll: boolean;
    private comparisonOffset: number;

    constructor(primaryView: RefObject<LogViewAndMinimap>, comparisonView: RefObject<LogViewAndMinimap>) {
        this.primaryView = primaryView;
        this.comparisonView = comparisonView;
        this.syncronizeScroll = true;
        this.comparisonOffset = 0;

        this.handlePrimaryViewStateChange = this.handlePrimaryViewStateChange.bind(this);
        this.handleComparisonViewStateChange = this.handleComparisonViewStateChange.bind(this);
        this.handlePrimaryMinimapScaleChange = this.handlePrimaryMinimapScaleChange.bind(this);
        this.handleComparisonMinimapScaleChange = this.handleComparisonMinimapScaleChange.bind(this);
    }

    public toggleSynchonizedScrolling() {
        this.syncronizeScroll = !this.syncronizeScroll;
        if (this.syncronizeScroll) {
            const primaryStart = this.primaryView.current?.state.logViewState?.start ?? 0;
            const comparisonStart = this.comparisonView.current?.state.logViewState?.start ?? 0;
            this.comparisonOffset = Math.round(comparisonStart - primaryStart);
        }
    }

    public handlePrimaryViewStateChange(trigger: enums.EventTrigger, state: LogViewState) {
        if (this.syncronizeScroll && trigger === enums.EventTrigger.UserScroll) {
            const newStart = state.start + this.comparisonOffset;
            this.comparisonView.current?.setLogViewStart(newStart);
        }
    }

    public handleComparisonViewStateChange(trigger: enums.EventTrigger, state: LogViewState) {
        if (this.syncronizeScroll && trigger === enums.EventTrigger.UserScroll) {
            const newStart = state.start - this.comparisonOffset;
            this.primaryView.current?.setLogViewStart(newStart);
        }
    }

    public handlePrimaryMinimapScaleChange(trigger: enums.EventTrigger, visibleItems: number) {
        if (this.syncronizeScroll && trigger === enums.EventTrigger.UserScroll) {
            this.comparisonView.current?.setMinimapVisibleItems(enums.EventTrigger.Syncronize, visibleItems);
        }
    }

    public handleComparisonMinimapScaleChange(trigger: enums.EventTrigger, visibleItems: number) {
        if (this.syncronizeScroll && trigger === enums.EventTrigger.UserScroll) {
            this.primaryView.current?.setMinimapVisibleItems(enums.EventTrigger.Syncronize, visibleItems);
        }
    }

}