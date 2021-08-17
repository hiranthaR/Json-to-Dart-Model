import { pubspec } from '../shared/pubspec';

/**
 * Adds all missing code generation libraries.
 */
export async function addCodeGenerationLibraries() {
    // All supported dependencies that are recommended to implement.
    await pubspec.addCodeGenerationLibraries();
}