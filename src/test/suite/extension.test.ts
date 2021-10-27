import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { fm } from '../../utils';
import { jsonReader } from '../../json-reader';
import { jsonc } from 'jsonc';

suite('JSON Reader Test Suite', async () => {
	const root = jsonReader.workspaceRoot;
	const modelsPath = `${root}/models.jsonc`;
	const directory = `${root}/.json_models`;
	const jsonPath = `${directory}/json_test.json`;
	const arrayJsonPath = `${directory}/array_json_test.json`;
	const modelsData = `{
	// Test file.
	"__className": "test",
	"message": "test"
}
	`;
	const jsonData = `{
	"__className": "test_three",
	"__path": "/lib/models/test_three",
	"message": "test"
}
	`;
	const arrayJsonData = `[
	{
	    "__className": "test_one",
	    "__path": "/lib/models/test_one",
	    "message": "test"
    },
	{
	    "__className": "test_two",
	    "__path": "/lib/models/test_two",
	    "message": "test"
    }
]
	`;

	test('Workspace root exists', () => {
		assert.ok(jsonReader.workspaceRoot !== undefined);
	});

	test('Sync does not exist and no data found', () => {
		assert.strictEqual(jsonReader.existsSyncDir, false);
		assert.strictEqual(jsonReader.existsSyncFile, false);
		assert.strictEqual(jsonReader.hasData, false);
	});

	test('Creates models.jsonc file and .json_models directory with data for the test', async () => {
		await fm.createDirectory(directory);
		fm.writeFile(modelsPath, modelsData);
		fm.writeFile(jsonPath, jsonData);
		fm.writeFile(arrayJsonPath, arrayJsonData);
	});

	test('Sync and data exist', () => {
		assert.strictEqual(jsonReader.existsSyncDir, true);
		assert.strictEqual(jsonReader.existsSyncFile, true);
		assert.strictEqual(jsonReader.hasData, true);
		assert.strictEqual(jsonReader.allData.length, 4);
	});

	test('Verification of data', () => {
		const data = jsonReader.allData;
		// Check errors.
		assert.strictEqual(data.some((v) => v[0] !== null), false);
		// Models file data.
		assert.strictEqual(data[0][1].className, 'test');
		assert.strictEqual(data[0][1].requiredPath, undefined);
		assert.strictEqual(data[0][1].filePath, modelsPath);
		assert.strictEqual(jsonc.stripComments(data[0][1].json), jsonc.stringify(data[0][1].value));
		// Directory data from multiple files.
		assert.strictEqual(data[1][1].className, 'test_one');
		assert.strictEqual(data[1][1].requiredPath, '/lib/models/test_one');
		assert.strictEqual(jsonc.stripComments(data[1][1].json), jsonc.stringify(data[1][1].value));
		assert.strictEqual(data[2][1].className, 'test_two');
		assert.strictEqual(data[2][1].requiredPath, '/lib/models/test_two');
		assert.strictEqual(jsonc.stripComments(data[2][1].json), jsonc.stringify(data[2][1].value));
		assert.strictEqual(data[3][1].className, 'test_three');
		assert.strictEqual(data[3][1].requiredPath, '/lib/models/test_three');
		assert.strictEqual(jsonc.stripComments(data[3][1].json), jsonc.stringify(data[3][1].value));
	});

	test('Cleaning of all test data files', async () => {
		fm.removeFile(modelsPath);
		fm.removeDirectory('/.json_models');
		assert.strictEqual(jsonReader.existsSyncDir, false, 'Could not delete /.json_models directory.');
		assert.strictEqual(jsonReader.existsSyncFile, false, 'Could not delete models.jsonc file.');
	});
});
