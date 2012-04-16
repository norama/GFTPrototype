Ext.define('FixMyStreet.view.ReportContainer', {
	extend: 'Ext.Container',
	alias: 'widget.reportcontainer',

	config: {
		title: 'Melden',
		iconCls: 'locate',
		layout: 'vbox',
		items: [
			{
				xtype: 'titlebar',
				cls: 'titlebar',
				docked: 'top',
				title: 'Defekt melden'
			},
			{
				xtype: 'selectfield',
				name: 'problemType',
				store: 'ProblemTypes'
			},
			{
				xtype: 'map',
				id: 'reportMap',
				// fill the remaining space with the map
				flex: 1,
				mapOptions: {
					zoom: 17,
					streetViewControl: false,
					navigationControl: false
				},
				useCurrentLocation: true
			},
			{
				xtype: 'textfield',
				id: 'addressTextField',
				label: 'Adresse',
				labelWidth: '5em',
				name: 'address',
				disabled: true
			},
			{
				xtype: 'button',
				id: 'reportButton',
				text: 'Jetzt melden',
				ui: 'action',
				disabled: true
			}
		]
	}
});