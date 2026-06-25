/**
 * API Contract Types
 * These types are derived directly from the backend DTOs to ensure contract alignment.
 * They should be updated whenever the backend DTOs change.
 */

// Difficulty levels enum (from backend DIFFICULTY_LEVELS)
export const DIFFICULTY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];

// Course status enum (from backend CourseStatus)
export const COURSE_STATUS = ['DRAFT', 'REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
export type CourseStatus = typeof COURSE_STATUS[number];

/**
 * CreateCourseDto - mirrors backend CreateCourseDto
 * Used when creating a new course via POST /api/courses
 */
export interface CreateCourseDto {
  // Required fields
  title: string;
  description: string;

  // Optional fields
  subtitle?: string;
  shortDescription?: string;
  thumbnail?: string;
  coverImage?: string;
  previewVideo?: string;
  promotionalVideo?: string;
  price?: number;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  language?: string;
  requirements?: string[];
  learningGoals?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  certificateEligible?: boolean;
  currency?: string;
  isFeatured?: boolean;
  isFlagged?: boolean;
  flaggedReason?: string;
}

/**
 * UpdateCourseDto - mirrors backend UpdateCourseDto
 * Used when updating a course via PUT/PATCH /api/courses/:id
 */
export interface UpdateCourseDto {
  title?: string;
  description?: string;
  subtitle?: string;
  shortDescription?: string;
  thumbnail?: string;
  coverImage?: string;
  previewVideo?: string;
  promotionalVideo?: string;
  price?: number;
  discountPrice?: number;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  language?: string;
  duration?: number;
  requirements?: string[];
  learningGoals?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  status?: CourseStatus;
  certificateEligible?: boolean;
  currency?: string;
  isFeatured?: boolean;
  isFlagged?: boolean;
  flaggedReason?: string;
}

/**
 * Validation helpers for course creation
 * These mirror the backend class-validator decorators
 */
export class CourseValidation {
  static validateCreateCourseDto(data: Partial<CreateCourseDto>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push('description is required and must be a non-empty string');
    }

    // Optional field validations
    if (data.price !== undefined) {
      if (typeof data.price !== 'number') {
        errors.push('price must be a number');
      } else if (data.price < 0) {
        errors.push('price must be at least 0');
      }
    }

    if (data.difficulty !== undefined && !DIFFICULTY_LEVELS.includes(data.difficulty)) {
      errors.push(`difficulty must be one of: ${DIFFICULTY_LEVELS.join(', ')}`);
    }

    if (data.requirements !== undefined) {
      if (!Array.isArray(data.requirements)) {
        errors.push('requirements must be an array');
      } else if (!data.requirements.every((r) => typeof r === 'string')) {
        errors.push('all requirements must be strings');
      }
    }

    if (data.learningGoals !== undefined) {
      if (!Array.isArray(data.learningGoals)) {
        errors.push('learningGoals must be an array');
      } else if (!data.learningGoals.every((g) => typeof g === 'string')) {
        errors.push('all learningGoals must be strings');
      }
    }

    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        errors.push('tags must be an array');
      } else if (!data.tags.every((t) => typeof t === 'string')) {
        errors.push('all tags must be strings');
      }
    }

    if (data.certificateEligible !== undefined && typeof data.certificateEligible !== 'boolean') {
      errors.push('certificateEligible must be a boolean');
    }

    if (data.isFeatured !== undefined && typeof data.isFeatured !== 'boolean') {
      errors.push('isFeatured must be a boolean');
    }

    if (data.isFlagged !== undefined && typeof data.isFlagged !== 'boolean') {
      errors.push('isFlagged must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a minimal valid CreateCourseDto with only required fields
   */
  static createMinimalDto(title: string, description: string): CreateCourseDto {
    return {
      title,
      description,
    };
  }

  /**
   * Filter an object to only include valid CreateCourseDto fields
   * This prevents sending unknown fields that would be rejected by forbidNonWhitelisted
   */
  static filterToValidCreateCourseDto(data: Record<string, unknown>): CreateCourseDto {
    const validFields: Partial<CreateCourseDto> = {};

    const allowedFields: (keyof CreateCourseDto)[] = [
      'title',
      'description',
      'subtitle',
      'shortDescription',
      'thumbnail',
      'coverImage',
      'previewVideo',
      'promotionalVideo',
      'price',
      'difficulty',
      'categoryId',
      'language',
      'requirements',
      'learningGoals',
      'tags',
      'seoTitle',
      'seoDescription',
      'certificateEligible',
      'currency',
      'isFeatured',
      'isFlagged',
      'flaggedReason',
    ];

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        validFields[field] = data[field] as any;
      }
    });

    return validFields as CreateCourseDto;
  }
}
