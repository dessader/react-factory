"use client";

import { useState } from "react";
import { Text } from "@/components/text";
import { Button, Unmemoized } from "@/components/button";
import { Link } from "@/components/link";
import { Form } from "@/components/form";

const HomePage = () => {
  const [tick, setTick] = useState(0);

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
    </main>
  );
};

export default HomePage;
