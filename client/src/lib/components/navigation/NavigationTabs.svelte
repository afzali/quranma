<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui-rtl/tabs';
	import { t } from '$lib/i18n';
	import { getSetting, setSetting } from '$lib/data/repositories/settings-repository';
	import TableOfContents from './TableOfContents.svelte';
	import SearchPanel from './SearchPanel.svelte';
	import BookmarksPanel from './BookmarksPanel.svelte';
	import TopicsPanel from './TopicsPanel.svelte';

	let activeTab = $state('toc');

	$effect(() => {
		restoreTab();
	});

	async function restoreTab() {
		try {
			const saved = await getSetting('active_nav_tab');
			if (saved && ['toc', 'search', 'bookmarks', 'topics'].includes(saved)) {
				activeTab = saved;
			}
		} catch {
			// ignore
		}
	}

	function handleTabChange(value: string) {
		activeTab = value;
		setSetting('active_nav_tab', value).catch(() => {});
	}
</script>

<Tabs value={activeTab} onValueChange={handleTabChange} class="flex flex-col h-full">
	<TabsList class="grid w-full grid-cols-4 shrink-0">
		<TabsTrigger value="toc">{t('nav.tab.toc')}</TabsTrigger>
		<TabsTrigger value="search">{t('nav.tab.search')}</TabsTrigger>
		<TabsTrigger value="bookmarks">{t('nav.tab.bookmarks')}</TabsTrigger>
		<TabsTrigger value="topics">{t('nav.tab.topics')}</TabsTrigger>
	</TabsList>

	<TabsContent value="toc" class="flex-1 overflow-hidden mt-0">
		<TableOfContents />
	</TabsContent>

	<TabsContent value="search" class="flex-1 overflow-hidden mt-0">
		<SearchPanel />
	</TabsContent>

	<TabsContent value="bookmarks" class="flex-1 overflow-hidden mt-0">
		<BookmarksPanel />
	</TabsContent>

	<TabsContent value="topics" class="flex-1 overflow-hidden mt-0">
		<TopicsPanel />
	</TabsContent>
</Tabs>
