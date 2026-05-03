<script lang="ts">
	import { t } from '$lib/i18n';
	import { getSetting, setSetting } from '$lib/data/repositories/settings-repository';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import WordAnalysisTab from './WordAnalysisTab.svelte';
	import TranslationTab from './TranslationTab.svelte';
	import TafsirTab from './TafsirTab.svelte';
	import SiyaqTab from './SiyaqTab.svelte';
	import NazmKaviTab from './NazmKaviTab.svelte';
	import ShabakeKaviTab from './ShabakeKaviTab.svelte';
	import EqamehTab from './EqamehTab.svelte';

	const SETTING_KEY = 'analysis_active_tab';
	const DEFAULT_TAB = 'word-analysis';

	const tabs = [
		{ id: 'word-analysis', labelKey: 'analysis.tab.word' },
		{ id: 'translation', labelKey: 'analysis.tab.translation' },
		{ id: 'tafsir', labelKey: 'analysis.tab.tafsir' },
		{ id: 'siyaq', labelKey: 'analysis.tab.siyaq' },
		{ id: 'nazm-kavi', labelKey: 'analysis.tab.nazm_kavi' },
		{ id: 'shabake-kavi', labelKey: 'analysis.tab.shabake_kavi' },
		{ id: 'eqameh', labelKey: 'analysis.tab.eqameh' }
	];

	let activeTab = $state(DEFAULT_TAB);

	// Restore last active tab from settings
	$effect(() => {
		getSetting(SETTING_KEY).then((val) => {
			if (val && tabs.some((t) => t.id === val)) {
				activeTab = val;
			}
		});
	});

	// Persist tab changes
	function handleTabChange(value: string) {
		activeTab = value;
		setSetting(SETTING_KEY, value).catch(() => {});
	}
</script>

<div class="flex h-full flex-col overflow-hidden">
	<Tabs value={activeTab} onValueChange={handleTabChange} class="flex h-full flex-col">
		<TabsList class="w-full flex-wrap h-auto gap-0.5 p-1">
			{#each tabs as tab (tab.id)}
				<TabsTrigger value={tab.id} class="text-xs px-1.5 py-1">
					{t(tab.labelKey)}
				</TabsTrigger>
			{/each}
		</TabsList>

		<TabsContent value="word-analysis" class="flex-1 overflow-y-auto p-2">
			<WordAnalysisTab />
		</TabsContent>
		<TabsContent value="translation" class="flex-1 overflow-y-auto p-2">
			<TranslationTab />
		</TabsContent>
		<TabsContent value="tafsir" class="flex-1 overflow-y-auto p-2">
			<TafsirTab />
		</TabsContent>
		<TabsContent value="siyaq" class="flex-1 overflow-y-auto p-2">
			<SiyaqTab />
		</TabsContent>
		<TabsContent value="nazm-kavi" class="flex-1 overflow-y-auto p-2">
			<NazmKaviTab />
		</TabsContent>
		<TabsContent value="shabake-kavi" class="flex-1 overflow-y-auto p-2">
			<ShabakeKaviTab />
		</TabsContent>
		<TabsContent value="eqameh" class="flex-1 overflow-y-auto p-2">
			<EqamehTab />
		</TabsContent>
	</Tabs>
</div>
