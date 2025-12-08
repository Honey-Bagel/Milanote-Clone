/**
 * Service Layer - Barrel exports
 *
 * Import services like:
 * import { CardService, BoardService, FileService } from '@/lib/services';
 */

export { CardService } from './card-service';
export { BoardService } from './board-service';
export { FileService } from './file-service';
export { CollaborationService } from './collaboration-service';

// Export types
export type { CreateCardParams, UpdateCardTransformParams, UpdateCardContentOptions } from './card-service';
export type { CreateBoardParams } from './board-service';
export type { CollaboratorRole, AddCollaboratorParams } from './collaboration-service';
