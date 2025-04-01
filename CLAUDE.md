# Commands for Claude Code

## Build Commands
- Frontend dev server: `cd frontend && npm run dev`
- Frontend build: `cd frontend && npm run build`
- Backend server: `cd backend && python manage.py runserver`
- Backend with HTTPS: `cd backend && python manage.py runsslserver`

## Lint Commands
- Frontend lint: `cd frontend && npm run lint`
- Frontend type check: `cd frontend && tsc --noEmit`
- Backend lint: `cd backend && python -m flake8`

## Test Commands
- Frontend tests: `cd frontend && npm test`
- Backend tests: `cd backend && python manage.py test`
- Single Django test: `cd backend && python manage.py test core.tests.MyTestClass.test_method_name`

## Code Style Guidelines
- TypeScript: Strict types required, unused variables/parameters forbidden
- React: Use functional components with hooks
- Python: PEP-8 compliant, Django best practices
- Error handling: Always catch and handle exceptions appropriately
- Imports: Group by type (standard lib, third-party, local)
- Naming: camelCase for JS/TS, snake_case for Python
- Security: No hard-coded credentials, validate all inputs
- Authentication: All sensitive routes must use ProtectedRoute component