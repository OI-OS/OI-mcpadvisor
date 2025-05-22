import { loadAll, addAdditionalSources } from './loadService.js';

async function main() {
  try {
    // Load all sources from config
    const result = await loadAll();
    console.log('Default sources results:');
    console.log(JSON.stringify(result, null, 2));

    // Load with additional sources custom field mappings
    const customMappedResult = await addAdditionalSources(
      {
        remote_urls: [],
        local_files: ['/Users/pyq/Downloads/my_mcp_sample.json'],
      },
      {
        // Map custom field names to canonical names
        name: ['display_name', 'label'],
        description: ['desc', 'summary', 'text'],
      },
    );
    console.log('\nCustom field mapping results:');
    console.log(JSON.stringify(customMappedResult, null, 2));
  } catch (error) {
    console.error('Error in loadService test:', error);
  }
}

main();
