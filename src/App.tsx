import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { Page404 } from '@pages/404'
import { LanguagesPage } from '@pages/[language]'
import { Layout } from '@widgets/Layout'

/*

+ Python
PHP
C++
Swift
C#

*/
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <></>
      </Layout>
    ),
  },
  {
    path: '/:language',
    element: <LanguagesPage />,
  },

  {
    path: '*',
    element: <Page404 />,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
