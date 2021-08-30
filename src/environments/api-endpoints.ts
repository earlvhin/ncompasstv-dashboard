export const API_ENDPOINTS = {
	auth: {
		api_login: 'account/login',
		api_refresh: 'token/refresh',
	},
	getters: {
		api_get_activities: 'activity/getall',
		api_get_activities_by_license_id: 'activity/getactivitybylicenseid?licenseid=',
		api_get_advertisers: 'advertiser/getall',
		api_get_advertisers_by_dealer_id: 'advertiser/getbydealerid?dealer_id=',
		api_get_advertisers_by_id: 'advertiser/getbyid?id=',
		api_get_advertiser_report: 'advertiser/getaddedreport',
		api_get_advertiser_total: 'advertiser/gettotal',
		api_get_advertiser_total_by_dealer: 'advertiser/gettotal?dealerid=',
        api_get_advertisers_unassigned: 'advertiser/getunassignedbydealerid?dealer_id=',
		api_get_assets: 'content/getall',
		api_get_blacklisted_by_id: 'blacklistedcontents/getblacklistedbyplaylistcontentid?playlistcontentid=',
		api_get_content: 'content/findall',
		api_get_content_metrics: 'contentplaysdaily/getcontentmetricsbydealer',
		api_get_categories: 'category/getall',
		api_get_dealer_total:'dealer/gettotal',
		api_get_global_settings: 'globalSettings/getall',
		api_get_host_fields: 'fieldgroup/getall',
		api_get_host_field_by_id: 'fieldgroupfield/getbyfieldgroupid?fieldgroupid=',
		api_get_parent_categories: 'category/getparentcategory',
		api_get_content_by_advertiser_id: 'content/getcontentsbyadvertiserid?advertiserid=',
		api_get_content_by_id: 'content/getcontentsbyid?contentid=',
		api_get_content_by_dealer_id: 'content/getbydealerid?dealerid=',
		api_get_content_daily_count: 'contentplays/getdailytotalbycontent',
        api_get_content_metrics_export: 'contentplaysdaily/exportscontentmetricsbycontent',
		api_get_content_monthly_count: 'contentplays/getmonthlytotalbycontent',
		api_get_content_yearly_count: 'contentplays/getyearlytotalbycontent',
		api_get_content_count_by_license: 'contentplays/gettotalbylicense',
		api_get_content_monthly_count_by_license: 'contentplaysdaily/getmonthlytotalbylicense',
		api_get_content_yearly_count_by_license: 'contentplays/getyeartotalbylicense',
		api_get_content_daily_count_by_license: 'contentplays/getdailytotalbylicense',
		api_get_content_by_license_zone: 'content/getcontentbylicenseid?licenseid=',
		api_get_content_hourly_by_license: 'contentplayshourly/getdailytotalbylicense',
		api_get_content_playing_where: 'content/getplayingwherebycontentsid',
		api_get_content_total: 'content/gettotal',
		api_get_content_total_by_dealer: 'content/gettotal?dealerid=',
		api_get_dealer_by_id: 'dealer/getbyid?dealer_id=',
		api_get_dealers: 'dealer/getall',
		api_get_dealers_content_metrics: 'contentplaysdaily/exportscontentmetricsbydealer',
		api_get_dealers_directory: 'dealer/getdirectorytree',
		api_get_dealers_with_sort: 'dealer/fetchallsorttotal',
		api_get_dealers_with_host: 'dealer/getdealerswithhost',
		api_get_dealers_with_advertiser: 'dealer/getdealerswithadvertiser',
		api_get_dealers_with_license: 'dealer/getdealerswithlicense',
		api_get_dealer_report: 'dealer/getaddedreport',
		api_get_generated_feed_by_id: 'feed/getbyfeedid?feedid=',
		api_get_feeds: 'feed/getall',
		api_get_feeds_total: 'feed/gettotal',
		api_get_feeds_by_dealer: 'feed/getbydealerid',
		api_get_feed_by_id: 'feed/getfeedbycontentid?contentid=',
		api_get_feed_types: 'feedtype/getall',
		api_get_host_by_dealer: 'host/getbydealer?dealerid=',
		api_get_host_for_dealer: 'host/gethostbydealer?dealerid=',
		api_get_host_total: 'host/gettotal',
		api_get_host_total_per_dealer: 'host/gettotal?dealerid=',
		api_get_host_by_id: 'host/getbyid?hostid=',
		api_get_host_by_id_optimized: 'host/getbydealerwithtotal?dealerid=',
		api_get_host_licenses_by_state: 'host/getlicensesperstate',
		api_get_host_licenses_by_state_details: 'host/getdealershostslicensesperstate?state=',
		api_get_host_report: 'host/getaddedreport',
		api_get_hosts: 'host/getall',
		api_get_licenses: 'license/getall',
		api_get_licenses_by_id: 'license/getlicensebyid?licenseid=',
		api_get_licenses_by_dealer: 'license/getbydealer',
		api_get_license_by_dealer_temp: 'license/getbydealerold?dealerid=',
		api_get_licenses_by_host: 'license/getbyhost?hostid=',
		api_get_license_report: 'license/getaddedreport',
		api_get_licenses_total: 'license/gettotal',
		api_get_licenses_total_by_dealer: 'license/gettotal?dealerid=',
        api_get_licenses_by_screen: 'license/getlicensesbyscreenid',
		api_get_notifications: 'notification/getbyreceiverid?receiver_id=',
		api_get_playlist: 'playlists/getall',
		api_get_all_playlist: 'playlists/getplaylistswithscreens',
		api_get_playlist_by_dealer_id: 'playlists/getplaylistbydealerid?dealerid=',
		api_get_playlist_by_dealer_id_table: 'playlists/getplaylistsbydealerid',
		api_get_playlist_by_id: 'playlists/getplaylistbyid?playlistid=',
		api_get_playlists_by_id: 'playlists/getplaylistsbyid?playlistid=',
		api_get_playlist_total: 'playlists/gettotal',
		api_get_playlist_total_by_dealer: 'playlists/gettotal?dealerid=',
		api_get_roles: 'role/getall',
		api_get_resource_logs: 'resourcelogs/getresourcelogbylicenseid?licenseid=',
		api_get_screen_by_id: 'screen/getscreenbyid?screenId=',
		api_get_screen_by_dealer: 'screen/getbydealerid?dealerId=',
		api_get_screen_by_dealer_table: 'screen/getscreenbydealerid',
		api_get_screens_of_playlist: 'screen/getscreenwithplaylistbyplaylistid?playlistid=',
		api_get_screens: 'screen/getall',
		api_get_screens_total: 'screen/gettotal',
		api_get_screens_total_by_dealer: 'screen/gettotal?dealerid=',
		api_get_screens_type: 'screentype/getall',
		api_get_screenshots: 'pi/getfiles?licenseid=',
		api_get_stats: 'dealer/getstatistics',
		api_get_timezone: 'timezone/getall',
		api_get_template_by_dealer_id: 'template/gettemplatebydealerid?dealerid=',
		api_get_template_by_id: 'template/gettemplatebyid?templateId=',
		api_get_templates: 'template/getall',
		api_get_user_by_id: 'user/getbyid?user_id=',
		api_get_users: 'user/getall',
		api_get_users_total: 'user/gettotal',
		api_google_map: 'googleapi/searchplaces?place=',
		api_renewsocket: 'license/renewsocket',
		api_search_dealer: 'dealer/searchdealer?search=',
		api_search_dealer_with_host: 'dealer/getdealerswithhost?search=',
		api_search_host: 'dealer/getdealerswithhost?search=',
		api_search_dealer_getall: 'dealer/getall?search=',
		api_apps: 'playerapp/getapp',
		api_apps_versions: 'playerapp/getappversions',
		api_apps_version: 'playerapp/getlatestversion?appid=',
		all_license_by_install_date: 'license/getlicensesbyinstalldate',
		content_by_host_id: 'content/getbyhostid',
		distinct_tags_by_tag_type: 'tag/getdistinctagsbytypeid?typeid=', // yes that is intentionally misspelled 
		distinct_tags_by_type_and_name: 'tag/GetDistincTagsByTypeIdAndTagName',
		export_dealer_licenses: 'license/exportbydealer?dealerid=',
		export_dealers: 'dealer/exportdealer',
		export_content_playlist: 'playlists/exportplaylistscontents?playlistId=',
		export_hosts: 'host/exportbydealer?dealerid=',
		license_statistics: 'license/getstatisticsbydealerid',
		license_statistics_by_install_date: 'license/getlicensestatisticsbyinstalldate?installdate=',
		search_advertiser: 'advertiser/search?searchkey=',
		search_license: 'license/search?searchkey=',
		search_tags: 'tag/searchtags',
		tag_types_by_type_id: 'tag/gettagsbytagtypeid?typeid=',
		tag_types_get_all: 'tag/GetAllTypes',
		tags_by_id: 'tag/gettagsbyid?tagid=',
		tags_by_owner_id: 'tag/gettagsbyownerid?ownerid',
		tags_by_tag_name_and_type: 'tag/gettagsbytagnameandtypeid',
		tags_count: 'tag/getalltagscount',
		tags_get_all: 'tag/getall',
		users_by_owner: 'user/GetAllUsersByOwnerId?ownerid=',
		validate_weather_zip: 'feed/weather/validate?zipcode='
	},
	create: {
		api_new_activity: 'activity/create',
		api_create_global_settings: 'globalsettings/create',
		api_new_admin: 'admin/create',
		api_new_advertiser: 'advertiser/create',
		api_new_advertiser_profile: 'advertiser/createadvertiser',
		api_new_dealer: 'dealer/create',
		api_new_feed: 'feed/create',
		api_new_feed_generate: 'feed/generate',
		api_new_slide_feed_demo: 'feed/preview/demo/slides',
		api_new_weather_feed_demo: 'feed/preview/demo/weather',
		api_new_host: 'host/create',
		api_new_host_place: 'host/createhost',
		api_new_license:'license/create?',
		api_new_playlist: 'playlists/create',
		api_clone_playlist: 'playlists/clone',
		api_create_field_group: 'fieldgroup/create',
		api_new_screen: 'screen/create',
		api_new_techrep: 'tech/create',
		api_new_template: 'template/create',
		api_new_app_version: 'playerapp/addversion',
		api_new_app: 'playerapp/create',
		api_fieldgroup_value_create: 'fieldgroupdvalue/create',
		api_save_activity: 'activity/log',
		content_schedule: 'playlistcontentsschedule/create',
		sub_dealer_account: 'account/createsubaccount',
		tag: 'tag/create',
		tag_type: 'tag/createtype'
	},
	third_party: {
		api_post_content_info: 'webhooks/processhandler',
		api_process_convert: 'webhooks/processconvert',
		api_process_files: 'webhooks/processfiles',
		filestack_api_key: 'ALjKIdQzT1uQvACcqMCnQz',
		filestack_policy: 'eyJjYWxsIjpbIndyaXRlIiwicmVtb3ZlIl0sImV4cGlyeSI6MTYxMjAyMjQwMH0',
		filestack_signature: '49306a4d1945bffbb381dd90b38be3a69230b2f473543d3d73440c77eeab730d',
		filestack_screenshot: 'https://cdn.filestackcontent.com/ALjKIdQzT1uQvACcqMCnQz/urlscreenshot=mode:window,height:1080,width:1920/resize=width:600/'
	},
	update: {
		account_permission: 'account/updatepermission',
		api_assign_license_to_screen: 'screen/assignlicenses',
		api_activate_license: 'license/activate?licenseKey=',
		api_assign_license_to_host: 'license/assignhost',
		api_assign_template_to_dealer: 'template/assigntodealer',
		api_blocklist_content: 'blacklistedcontents/create',
		api_deactivate_license: 'license/deactivate?licenseKey=',
		api_display_status: 'license/updatedisplaystatus',
		api_update_advertiser: 'advertiser/updateadvertiser',
		api_update_alias: 'license/updatealias',
		api_update_dealer: 'dealer/update',
		api_update_feed: 'feed/update',
		api_update_generated_feed: 'feed/edit',
		api_update_host: 'host/updatehost',
		api_update_internet_info: 'license/updateinternetinfo',
		api_update_playlist_content: 'playlists/addcontent',
		api_update_playlist_info: 'playlists/updateplaylistinfo',
		api_update_screen: 'screen/edit',
		api_update_screenshot_settings: 'license/screenshotsettings',
		api_update_speedtest_settings: 'license/speedtestsettings',
		api_update_slide_feed: 'feed/update/slides',
		api_update_content: 'content/unassigndealer',
		api_update_user: 'user/update',
		api_update_weather_feed: 'feed/update/weather',
		content_schedule: 'playlistcontentsschedule/update',
		dealer_status: 'dealer/updatestatus',
		install_date: 'license/updateinstalldate',
		install_date_list: 'license/updateinstalldatelist',
		play_credits: 'playlists/addcredits',
		reassign_content: 'content/reassigncontent',
		reassign_dealer: 'dealer/reassigndealer',
		set_content_frequency: 'playlists/cloneplaylistcontent',
		tag: 'tag/update',
		tag_type: 'tag/updatetype',
		user_email_settings: 'user/updateemailsettings',
	},
	delete: {
		api_delete_screenshot: 'pi/deletescreenshots',
		api_remove_advertiser: 'advertiser/removeadvertiser?advertiserid=',
		api_remove_content: 'content/removebycontentid',
		api_remove_player_app: 'playerapp/removeplayerapp',
		api_remove_player_app_version: 'playerapp/RemovePlayerAppVersion',
		api_remove_playlist: 'playlists/removeplaylist?playlistid=',
		api_remove_playlist_content: 'playlists/removecontent',
		api_remove_playlist_contents: 'playlists/removecontents',
		api_remove_screenshots: 'pi/removefiles?licenseid=',
		api_remove_in_blacklist: 'blacklistedcontents/delete',
		api_bulk_remove_in_blacklist: 'blacklistedcontents/bulkdelete',
		api_remove_license: 'license/removebylicenseid',
		api_remove_screen: 'screen/removebyscreenid',
		api_remove_screen_license: 'screen/unassignlicense',
		api_remove_host_licenses: 'license/unassignhost?force=1',
		host: 'host/delete',
		tag: 'tag/delete',
		tag_by_id_and_owner: 'tag/DeleteByOwnerIdAndTagId',
		tag_by_owner_id: 'tag/DeleteByOwnerId?ownerid=',
		user: 'user/delete',
	}
};