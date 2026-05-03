// Course Context — reactive state for the active course and course list
// Uses Svelte 5 runes for reactivity

import {
	getAllCourses as repoGetAllCourses,
	getCourseById,
	insertCourse,
	updateCourseName,
	updateCourseAvatar,
	deleteCourseAndData,
	duplicateCourse as repoDuplicateCourse,
	getCourseCount
} from '$lib/data/repositories/course-repository';
import { getSetting, setSetting } from '$lib/data/repositories/settings-repository';

export interface Course {
	id: number;
	name: string;
	avatarUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

let activeCourse = $state<Course | null>(null);
let allCourses = $state<Course[]>([]);

/**
 * Get the currently active course.
 */
export function getActiveCourse(): Course | null {
	return activeCourse;
}

/**
 * Get the active course's ID, or null if no course is active.
 */
export function getActiveCourseId(): number | null {
	return activeCourse?.id ?? null;
}

/**
 * Get all courses.
 */
export function getAllCourses(): Course[] {
	return allCourses;
}

/**
 * Initialize the course context.
 * Loads all courses, creates a default course if none exist,
 * and restores the active course from APP_SETTINGS.
 */
export async function initCourseContext(): Promise<void> {
	await refreshCourses();

	// Create default course if none exist
	if (allCourses.length === 0) {
		const id = await insertCourse('پیش‌فرض');
		await refreshCourses();
		activeCourse = allCourses.find((c) => c.id === id) ?? allCourses[0] ?? null;
		if (activeCourse) {
			await setSetting('active_course_id', String(activeCourse.id));
		}
		return;
	}

	// Restore active course from settings
	const storedId = await getSetting('active_course_id');
	if (storedId) {
		const id = parseInt(storedId, 10);
		const found = allCourses.find((c) => c.id === id);
		if (found) {
			activeCourse = found;
			return;
		}
	}

	// Fall back to first course
	activeCourse = allCourses[0] ?? null;
	if (activeCourse) {
		await setSetting('active_course_id', String(activeCourse.id));
	}
}

/**
 * Switch to a different course.
 * Persists the active course ID to APP_SETTINGS.
 */
export async function switchCourse(courseId: number): Promise<void> {
	const course = allCourses.find((c) => c.id === courseId);
	if (!course) return;

	activeCourse = course;
	await setSetting('active_course_id', String(courseId));
}

/**
 * Create a new course and switch to it.
 */
export async function createCourse(name: string): Promise<Course> {
	const id = await insertCourse(name);
	await refreshCourses();
	const newCourse = allCourses.find((c) => c.id === id)!;
	activeCourse = newCourse;
	await setSetting('active_course_id', String(id));
	return newCourse;
}

/**
 * Rename a course.
 */
export async function renameCourse(courseId: number, newName: string): Promise<void> {
	await updateCourseName(courseId, newName);
	await refreshCourses();
	// Update activeCourse reference if it was the renamed one
	if (activeCourse?.id === courseId) {
		activeCourse = allCourses.find((c) => c.id === courseId) ?? activeCourse;
	}
}

/**
 * Delete a course and all associated data.
 * Returns false if this is the last course (deletion prevented).
 */
export async function deleteCourse(courseId: number): Promise<boolean> {
	const count = await getCourseCount();
	if (count <= 1) return false;

	await deleteCourseAndData(courseId);
	await refreshCourses();

	// If deleted course was active, switch to first remaining
	if (activeCourse?.id === courseId) {
		activeCourse = allCourses[0] ?? null;
		if (activeCourse) {
			await setSetting('active_course_id', String(activeCourse.id));
		}
	}

	return true;
}

/**
 * Duplicate a course and switch to the copy.
 */
export async function duplicateCourse(courseId: number): Promise<Course> {
	const source = allCourses.find((c) => c.id === courseId);
	const newName = source ? `${source.name} (کپی)` : 'کپی';
	const newId = await repoDuplicateCourse(courseId, newName);
	await refreshCourses();
	const newCourse = allCourses.find((c) => c.id === newId)!;
	activeCourse = newCourse;
	await setSetting('active_course_id', String(newId));
	return newCourse;
}

/**
 * Set a course's avatar URL.
 */
export async function setCourseAvatar(courseId: number, avatarUrl: string): Promise<void> {
	await updateCourseAvatar(courseId, avatarUrl);
	await refreshCourses();
	if (activeCourse?.id === courseId) {
		activeCourse = allCourses.find((c) => c.id === courseId) ?? activeCourse;
	}
}

// ── Internal helpers ──────────────────────────────────────────

async function refreshCourses(): Promise<void> {
	const rows = await repoGetAllCourses();
	allCourses = rows.map((row) => ({
		id: row.id,
		name: row.name,
		avatarUrl: row.avatar_url,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}));
}
