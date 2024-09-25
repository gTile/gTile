/**
 * Represents a node in a binary tree.
 */
export interface Node<T> {
  data: T;
  left?: Node<T>;
  right?: Node<T>;
}