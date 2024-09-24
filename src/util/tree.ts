/**
 * Represents a node in a binary tree.
 */
export class Node<T> {
  data: T;
  left?: Node<T>;
  right?: Node<T>;

  constructor(data: T) {
    this.data = data;
  }
}