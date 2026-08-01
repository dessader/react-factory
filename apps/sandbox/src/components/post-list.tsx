import { createComponent } from "@react-factory/create-component";

type Post = {
  id: number;
  title: string;
};

const fetchPosts = async (limit: number): Promise<Post[]> => {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_limit=${limit}`,
  );

  return response.json();
};

type PostListProps = {
  limit: number;
};

export const PostList = createComponent<PostListProps>()({
  element: "ul",
  Render: async (Component, { limit, ...props }) => {
    const posts = await fetchPosts(limit);

    return (
      <Component {...props}>
        {posts.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </Component>
    );
  },
});

PostList.displayName = "PostList";
