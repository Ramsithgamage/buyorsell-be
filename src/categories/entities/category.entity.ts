import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Expose } from 'class-transformer';
import slugify from 'slugify';
import { Advertisement } from '../../advertisements/entities/advertisement.entity';

@Entity('categories')
export class Category {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  @Expose()
  @Column({ unique: true, length: 100 })
  name!: string;

  @Expose()
  @Column({ unique: true, length: 120 })
  slug!: string;

  @Expose()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Expose()
  @Index()
  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId!: number | null;

  @Expose()
  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent!: Category | null;

  @Expose()
  @OneToMany(() => Category, (category) => category.parent)
  children!: Category[];

  @Expose()
  @OneToMany(() => Advertisement, (ad) => ad.category)
  advertisements!: Advertisement[];

  @Expose()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (!this.slug && this.name) {
      this.slug = slugify(this.name, { lower: true, strict: true });
    }
  }

  /**
   * Builds a hierarchical tree from a flat list of categories.
   * If onlyActive is true, prunes inactive sub-trees recursively.
   */
  static buildTree(flatCategories: Category[], onlyActive = false): Category[] {
    const map = new Map<number, Category>();

    // Step 1: Pre-populate map and initialize children arrays
    for (const cat of flatCategories) {
      cat.children = [];
      map.set(cat.id, cat);
    }

    let targets = flatCategories;

    // Step 2: Apply recursive active check if requested
    if (onlyActive) {
      const activeMemo = new Map<number, boolean>();

      const checkActive = (id: number): boolean => {
        if (activeMemo.has(id)) {
          return activeMemo.get(id)!;
        }

        const cat = map.get(id);
        if (!cat) {
          return false;
        }

        if (!cat.isActive) {
          activeMemo.set(id, false);
          return false;
        }

        // If it's a root category and active, it's valid
        if (cat.parentId === null || cat.parentId === undefined) {
          activeMemo.set(id, true);
          return true;
        }

        // Otherwise, recursively check the parent
        const parentActive = checkActive(cat.parentId);
        activeMemo.set(id, parentActive);
        return parentActive;
      };

      targets = flatCategories.filter((cat) => checkActive(cat.id));

      // Re-create the map with only filtered active categories
      map.clear();
      for (const cat of targets) {
        cat.children = [];
        map.set(cat.id, cat);
      }
    }

    const roots: Category[] = [];

    // Step 3: Construct the tree hierarchy
    for (const cat of targets) {
      if (cat.parentId === null || cat.parentId === undefined) {
        roots.push(cat);
      } else {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
        } else {
          // If the parent is not present in the map (e.g. was inactive or deleted),
          // this category becomes a root category in the current tree context.
          roots.push(cat);
        }
      }
    }

    return roots;
  }
}
