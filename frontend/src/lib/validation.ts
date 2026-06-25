export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePrice(price: number): boolean {
  return price >= 0 && price <= 1000000;
}

export function validateDuration(duration: number): boolean {
  return duration > 0 && duration <= 100000; // Max 100k minutes
}

export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateCourseBasics(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!data.description || data.description.length < 50) {
    errors.push('Description must be at least 50 characters');
  }

  if (data.thumbnail && !validateUrl(data.thumbnail)) {
    errors.push('Thumbnail must be a valid URL');
  }

  if (data.coverImage && !validateUrl(data.coverImage)) {
    errors.push('Cover image must be a valid URL');
  }

  if (data.price !== undefined && !validatePrice(data.price)) {
    errors.push('Price must be between $0 and $1,000,000');
  }

  if (data.discountPrice !== undefined && !validatePrice(data.discountPrice)) {
    errors.push('Discount price must be between $0 and $1,000,000');
  }

  if (data.duration !== undefined && !validateDuration(data.duration)) {
    errors.push('Duration must be between 1 and 100,000 minutes');
  }

  if (!data.difficulty || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(data.difficulty)) {
    errors.push('Invalid difficulty level');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLearningOutcomes(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.learningGoals || data.learningGoals.length === 0) {
    errors.push('At least one learning goal is required');
  }

  if (data.learningGoals && data.learningGoals.some((goal: string) => goal.length < 10)) {
    errors.push('Each learning goal must be at least 10 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
