/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProblemThumbnail {
  id: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  artStyle: string;
  imageDataUrl?: string;
  timestamp: number;
}

export interface HistoryEntry {
  id: string;
  problemId: string;
  thumbnail: ProblemThumbnail;
  viewedAt: number;
  completed: boolean;
}

class HistoryService {
  private readonly STORAGE_KEY = 'slate_problem_history';
  private readonly THUMBNAILS_KEY = 'slate_thumbnails_cache';
  private thumbnails: ProblemThumbnail[] = [];
  private history: HistoryEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load thumbnails from JSON file or cache
   */
  async loadThumbnails(): Promise<ProblemThumbnail[]> {
    // Check cache first
    const cached = this.getThumbnailsFromCache();
    if (cached && cached.length > 0) {
      this.thumbnails = cached;
      return cached;
    }

    try {
      // Try to load from public assets
      const response = await fetch('/assets/problem-thumbnails.json');
      if (response.ok) {
        const data = await response.json();
        this.thumbnails = data;
        this.saveThumbnailsToCache(data);
        return data;
      }
    } catch (error) {
      console.error('Failed to load thumbnails:', error);
    }

    // Return default thumbnails if loading fails
    return this.getDefaultThumbnails();
  }

  /**
   * Get default thumbnails (fallback) - showcasing diverse educational topics
   */
  private getDefaultThumbnails(): ProblemThumbnail[] {
    return [
      {
        id: 'default-1',
        title: 'Sorting Algorithms',
        category: 'algorithms',
        difficulty: 'easy',
        description: 'Master sorting and searching with AI',
        artStyle: 'Impressionist Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-2',
        title: 'Calculus & Derivatives',
        category: 'mathematics',
        difficulty: 'medium',
        description: 'Understand calculus concepts visually',
        artStyle: 'Classical Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-3',
        title: 'Newton\'s Laws of Motion',
        category: 'physics',
        difficulty: 'medium',
        description: 'Explore physics through visualization',
        artStyle: 'Dynamic Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-4',
        title: 'Molecular Structures',
        category: 'chemistry',
        difficulty: 'hard',
        description: 'Learn chemistry with interactive models',
        artStyle: 'Scientific Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-5',
        title: 'Geometric Proofs',
        category: 'geometry',
        difficulty: 'easy',
        description: 'Master geometry with step-by-step guidance',
        artStyle: 'Geometric Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-6',
        title: 'Linear Equations',
        category: 'algebra',
        difficulty: 'medium',
        description: 'Solve equations with AI assistance',
        artStyle: 'Modern Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-7',
        title: 'Cell Biology',
        category: 'biology',
        difficulty: 'hard',
        description: 'Explore life sciences interactively',
        artStyle: 'Organic Watercolor',
        timestamp: Date.now()
      },
      {
        id: 'default-8',
        title: 'Probability & Statistics',
        category: 'statistics',
        difficulty: 'easy',
        description: 'Understand data analysis visually',
        artStyle: 'Analytical Watercolor',
        timestamp: Date.now()
      }
    ];
  }

  /**
   * Get all thumbnails
   */
  getAllThumbnails(): ProblemThumbnail[] {
    return this.thumbnails;
  }

  /**
   * Get thumbnails by category
   */
  getThumbnailsByCategory(category: string): ProblemThumbnail[] {
    return this.thumbnails.filter(t => t.category === category);
  }

  /**
   * Get thumbnails by difficulty
   */
  getThumbnailsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): ProblemThumbnail[] {
    return this.thumbnails.filter(t => t.difficulty === difficulty);
  }

  /**
   * Get a single thumbnail by ID
   */
  getThumbnailById(id: string): ProblemThumbnail | undefined {
    return this.thumbnails.find(t => t.id === id);
  }

  /**
   * Truncate title for display
   */
  truncateTitle(title: string, maxLength: number = 30): string {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 3) + '...';
  }

  /**
   * Add a problem to history
   */
  addToHistory(thumbnail: ProblemThumbnail): void {
    const entry: HistoryEntry = {
      id: `history-${Date.now()}`,
      problemId: thumbnail.id,
      thumbnail,
      viewedAt: Date.now(),
      completed: false
    };

    // Remove duplicate if exists
    this.history = this.history.filter(h => h.problemId !== thumbnail.id);
    
    // Add to beginning
    this.history.unshift(entry);

    // Keep only last 50 items
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }

    this.saveToStorage();
  }

  /**
   * Mark a problem as completed
   */
  markAsCompleted(problemId: string): void {
    const entry = this.history.find(h => h.problemId === problemId);
    if (entry) {
      entry.completed = true;
      this.saveToStorage();
    }
  }

  /**
   * Get history entries
   */
  getHistory(limit?: number): HistoryEntry[] {
    return limit ? this.history.slice(0, limit) : this.history;
  }

  /**
   * Get recent problems
   */
  getRecentProblems(limit: number = 6): ProblemThumbnail[] {
    return this.history
      .slice(0, limit)
      .map(h => h.thumbnail);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.history = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      this.history = [];
    }
  }

  /**
   * Save thumbnails to cache
   */
  private saveThumbnailsToCache(thumbnails: ProblemThumbnail[]): void {
    try {
      localStorage.setItem(this.THUMBNAILS_KEY, JSON.stringify(thumbnails));
    } catch (error) {
      console.error('Failed to cache thumbnails:', error);
    }
  }

  /**
   * Get thumbnails from cache
   */
  private getThumbnailsFromCache(): ProblemThumbnail[] | null {
    try {
      const data = localStorage.getItem(this.THUMBNAILS_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load cached thumbnails:', error);
      return null;
    }
  }

  /**
   * Search thumbnails
   */
  searchThumbnails(query: string): ProblemThumbnail[] {
    const lowerQuery = query.toLowerCase();
    return this.thumbnails.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const historyService = new HistoryService();
