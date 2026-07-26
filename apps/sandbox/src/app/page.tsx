"use client";

import { useRef, useState } from "react";
import { Text } from "@/components/text";
import { Button, Unmemoized } from "@/components/button";
import { Link } from "@/components/link";
import { Form } from "@/components/form";
import {
  Card,
  Badge,
  Heading,
  StrictForm,
  Avatar,
  Price,
  Input,
} from "@/components/examples";

const HomePage = () => {
  const [tick, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <main>
      <h1>@react-forge/sandbox</h1>

      <section>
        <h2>Basic factory usage</h2>
        <Text tone='accent'>Paragraph rendered via the factory.</Text>
        <Text component='span' tone='muted'>
          Same factory, rendered as a span.
        </Text>
      </section>

      <section>
        <h2>Local wrapper around the factory</h2>
        <p>
          Clicking re-renders the parent without changing either button&apos;s
          props. <code>Button</code> is memoized (<code>memo: true</code> by
          default) and its render count stays put once mounted;{" "}
          <code>Unmemoized</code> re-renders every time.
        </p>
        <button type='button' onClick={() => setTick((value) => value + 1)}>
          Re-render parent ({tick})
        </button>
        <div className='row'>
          <Button variant='primary'>Memoized</Button>
          <Unmemoized>Not memoized</Unmemoized>
        </div>
      </section>

      <section>
        <h2>Multiple factories</h2>
        <div className='row'>
          <Link href='/somewhere'>Polymorphic link</Link>
          <Form action='/submit'>
            <button type='submit'>Submit</button>
          </Form>
        </div>
      </section>

      <section>
        <h2>Examples</h2>

        <h3>Custom root element</h3>
        <Card className="card">Card content</Card>

        <h3>Custom props</h3>
        <Badge count={3} />

        <h3>Polymorphism</h3>
        <div className="row">
          <Heading>Renders as an h2 by default</Heading>
          <Heading component="h1">Renders as an h1</Heading>
          <Heading component="a" href="/docs">
            Renders as a link, fully typed against anchor props
          </Heading>
        </div>

        <h3>Disabling polymorphism</h3>
        <StrictForm action="/submit" />

        <h3>Memoization</h3>
        <div className="row">
          <Avatar src="/avatar.png" />
          <Price amount={42} />
        </div>

        <h3>Ref forwarding</h3>
        <div className="row">
          <Input ref={inputRef} />
          <Input component="textarea" ref={(el) => console.log(el)} />
        </div>
      </section>
    </main>
  );
};

export default HomePage;
